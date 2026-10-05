type PublicHealth = {status:'operational'|'degraded'|'unknown';checkedAt:string;scope:'chat_generation'|'model_connection';detail:string};
export async function checkJarenConnection(apiKey: string | undefined, model: string): Promise<PublicHealth> {
  const checkedAt = new Date().toISOString();
  let status: PublicHealth['status'] = 'unknown';
  if (!apiKey) status = 'degraded';
  else try {
    const response = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(5000),cache:'no-store'});
    const body = await response.json();
    status = response.ok && body?.id === model && body?.object === 'model' ? 'operational' : 'degraded';
  } catch {}
  return {status,checkedAt,scope:'model_connection',detail: status === 'operational' ? 'Jaren model connection verified.' : 'Jaren model connection could not be verified.'};
}
export async function checkPublicJarenConnection(apiKey: string | undefined, model: string, requestFetch: typeof fetch = fetch): Promise<PublicHealth> {
  const checkedAt = new Date().toISOString();
  const result = (status: PublicHealth['status'], detail: string): PublicHealth => ({status,checkedAt,scope:'chat_generation',detail});
  if (!apiKey) return result('degraded','Jaren chat generation is unavailable.');
  try {
    const response = await requestFetch('https://api.openai.com/v1/responses', {
      method:'POST', headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(10000),cache:'no-store',
      body:JSON.stringify({model,input:'Reply with exactly: OK',max_output_tokens:128,reasoning:{effort:'low'}}),
    });
    if (!response.ok) return result('degraded','Jaren chat generation is unavailable.');
    const body = await response.json();
    const output = body?.output?.flatMap((item: {content?: {type:string;text?:string}[]}) => item.content ?? []).filter((part: {type:string}) => part.type === 'output_text').map((part: {text?:string}) => part.text ?? '').join('').trim();
    if (body?.status !== 'completed' || output !== 'OK') return result('unknown','Jaren chat generation could not be verified.');
    return result('operational','Jaren chat generation returned the expected test response. Conversation persistence and tenant tools are not tested.');
  } catch { return result('unknown','Jaren chat generation could not be verified.'); }
}

let cached: {expires:number;value:PublicHealth} | undefined;
let inFlight: Promise<PublicHealth> | undefined;
export async function publicJarenHealth(mode = 'generation') {
  if (mode === 'connection') return checkJarenConnection(process.env.OPENAI_API_KEY, process.env.AI_MODEL ?? 'gpt-5');
  if (cached && cached.expires > Date.now()) return cached.value;
  if (!inFlight) inFlight = checkPublicJarenConnection(process.env.OPENAI_API_KEY, process.env.AI_MODEL ?? 'gpt-5')
    .then(value => {cached={expires:Date.now()+300000,value};return value;})
    .finally(() => {inFlight=undefined;});
  return inFlight;
}
