import {timingSafeEqual} from 'node:crypto';
import {databaseHealth,decisionHealth} from '@/lib/status/platform-health';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const token=process.env.JAREN_STATUS_CHECK_TOKEN;
 const wanted=token?`Bearer ${token}`:'',provided=request.headers.get('authorization')||'';
 if(!wanted||Buffer.byteLength(wanted)!==Buffer.byteLength(provided)||!timingSafeEqual(Buffer.from(wanted),Buffer.from(provided)))return Response.json({error:'Unauthorized'},{status:401});
 const service=new URL(request.url).searchParams.get('service');
 if(service!=='engine'&&service!=='database')return Response.json({error:'Invalid service'},{status:400});
 const health=service==='engine'?await decisionHealth():await databaseHealth();
 return Response.json(health,{headers:{'Cache-Control':'no-store'}});
}
