import {describe,it,expect} from 'vitest';
import {createHmac} from 'node:crypto';
import {signatureValid,validateEnvelope,receiptFor,canonical} from '../../src/lib/integrations/dataPreview.mjs';
const report={sourceOrganizationId:'11111111-1111-4111-a111-111111111111',clientId:'22222222-2222-4222-a222-222222222222',jobId:'33333333-3333-4333-a333-333333333333',template:{name:'Employee',version:'1.0'},status:'Ready',summary:{inputRows:2,acceptedRows:2,rejectedRows:0,errors:0},createdAt:'2026-11-01T00:00:00Z'};
const envelope=()=>({event:'data_preview.validation.completed',version:1,deliveryId:'a'.repeat(64),timestamp:new Date().toISOString(),report});
describe('Data Preview summary delivery contract',()=>{
 it('verifies exact signed bytes and rejects malformed signatures',()=>{const secret='s'.repeat(48),raw=JSON.stringify(envelope()),sig=createHmac('sha256',secret).update(raw).digest('hex');expect(signatureValid(secret,raw,sig)).toBe(true);expect(signatureValid(secret,raw+' ',sig)).toBe(false);expect(signatureValid(secret,raw,'zz')).toBe(false);});
 it('rejects expired messages and private row content',()=>{expect(validateEnvelope(envelope()).report.jobId).toBe(report.jobId);expect(()=>validateEnvelope({...envelope(),timestamp:'2000-01-01T00:00:00Z'})).toThrow();expect(()=>validateEnvelope({...envelope(),report:{...report,rows:[['private']]}})).toThrow();expect(()=>validateEnvelope({...envelope(),report:{...report,summary:{...report.summary,email:'private'}}})).toThrow();});
 it('keeps receipts stable and isolated by webhook',()=>{expect(receiptFor('one','key')).toBe(receiptFor('one','key'));expect(receiptFor('one','key')).not.toBe(receiptFor('two','key'));expect(canonical({b:2,a:1})).toBe(canonical({a:1,b:2}));});
});
