import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export function signatureValid(secret,raw,signature){if(typeof secret!=='string'||secret.length<32||!/^[0-9a-f]{64}$/i.test(signature||''))return false;return timingSafeEqual(createHmac('sha256',secret).update(raw).digest(),Buffer.from(signature,'hex'));}
export function validateEnvelope(value,now=Date.now()){
 const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(v,k));
 if(!exact(value,['event','version','deliveryId','timestamp','report'])||value.event!=='data_preview.validation.completed'||value.version!==1||!/^[a-f0-9]{64}$/.test(value.deliveryId)||!Number.isFinite(Date.parse(value.timestamp))||Math.abs(now-Date.parse(value.timestamp))>300000)throw Error('Invalid delivery envelope.');
 const r=value.report;if(!exact(r,['sourceOrganizationId','clientId','jobId','template','status','summary','createdAt'])||![r.sourceOrganizationId,r.clientId,r.jobId].every(uuid)||!['Ready','Needs Review','Blocked'].includes(r.status)||!Number.isFinite(Date.parse(r.createdAt))||!exact(r.template,['name','version'])||![r.template.name,r.template.version].every(x=>typeof x==='string'&&x.length>0&&x.length<=200))throw Error('Invalid report.');
 const keys=['inputRows','acceptedRows','rejectedRows','duplicatesRemoved','cellsTrimmed','errors','emailRepairSuggestions','emailRepairsApplied'];
 if(!r.summary||typeof r.summary!=='object'||Array.isArray(r.summary)||!['inputRows','acceptedRows','rejectedRows','errors'].every(k=>Object.hasOwn(r.summary,k))||Object.entries(r.summary).some(([k,v])=>!keys.includes(k)||!Number.isSafeInteger(v)||v<0))throw Error('Invalid summary.');
 return value;
}
export function receiptFor(webhookId,deliveryId){const s=createHash('sha256').update(webhookId+'|'+deliveryId).digest('hex');return `${s.slice(0,8)}-${s.slice(8,12)}-4${s.slice(13,16)}-a${s.slice(17,20)}-${s.slice(20,32)}`;}
export function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
