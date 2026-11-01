import { createAdminClient } from '@/lib/supabase/admin';
import { signatureValid, validateEnvelope, receiptFor, canonical } from '@/lib/integrations/dataPreview.mjs';

export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 try {
  const {token}=await params;if(!/^[a-f0-9]{32}$/.test(token))return json({error:'Connection not found.'},404);
  const reader=request.body?.getReader();if(!reader)return json({error:'Body required.'},400);
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();return json({error:'Summary exceeds size limit.'},413);}chunks.push(value);}
  const raw=Buffer.concat(chunks).toString('utf8');const admin=createAdminClient();
  const {data:webhook,error:lookupError}=await admin.from('webhooks').select('id,org_id,secret,is_active,data_source_id').eq('inbound_token',token).eq('direction','inbound').maybeSingle();
  if(lookupError)return json({error:'Connection lookup unavailable.'},503);
  if(!webhook?.is_active||!webhook.data_source_id)return json({error:'Connection not found.'},404);
  if(!signatureValid(webhook.secret,raw,request.headers.get('x-cpsm-signature')))return json({error:'Invalid signature.'},401);
  let envelope;try{envelope=validateEnvelope(JSON.parse(raw));}catch{return json({error:'Invalid summary or expired delivery timestamp.'},400);}
  const {data:source,error:sourceError}=await admin.from('data_sources').select('id,org_id,client_id,config').eq('id',webhook.data_source_id).eq('org_id',webhook.org_id).maybeSingle();
  if(sourceError)return json({error:'Destination lookup unavailable.'},503);
  const config=(source?.config??{}) as Record<string,unknown>;
  if(!source?.client_id||source.client_id!==envelope.report.clientId||config.datapreview_organization_id!==envelope.report.sourceOrganizationId)return json({error:'Client or source organization does not match this connection.'},403);
  const {data:client,error:clientError}=await admin.from('clients').select('id').eq('id',source.client_id).eq('org_id',webhook.org_id).maybeSingle();
  if(clientError)return json({error:'Client lookup unavailable.'},503);
  if(!client)return json({error:'Destination client unavailable.'},403);
  const receiptId=receiptFor(webhook.id,envelope.deliveryId);
  const payload={deliveryId:envelope.deliveryId,report:envelope.report};
  const {error}=await admin.from('webhook_deliveries').insert({id:receiptId,webhook_id:webhook.id,org_id:webhook.org_id,event:envelope.event,direction:'inbound',payload,success:true,response_status:200});
  if(error){
   if(error.code!=='23505')return json({error:'Receipt could not be recorded. Retry the same delivery.'},503);
   const {data:existing,error:readError}=await admin.from('webhook_deliveries').select('payload,success').eq('id',receiptId).eq('webhook_id',webhook.id).eq('org_id',webhook.org_id).maybeSingle();
   if(readError)return json({error:'Receipt lookup unavailable.'},503);
   if(!existing?.success||canonical(existing.payload)!==canonical(payload))return json({error:'Delivery identifier conflict.'},409);
  }
  return json({ok:true,deliveryId:envelope.deliveryId,receiptId,reused:!!error});
 }catch{return json({error:'Delivery service unavailable.'},503);}
}
