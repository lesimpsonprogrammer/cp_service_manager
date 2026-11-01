export interface ValidationEnvelope {
 event: 'data_preview.validation.completed';version:1;deliveryId:string;timestamp:string;
 report:{sourceOrganizationId:string;clientId:string;jobId:string;template:{name:string;version:string};status:'Ready'|'Needs Review'|'Blocked';summary:Record<string,number>;createdAt:string};
}
export function signatureValid(secret:string,raw:string,signature:string|null):boolean;
export function validateEnvelope(value:unknown,now?:number):ValidationEnvelope;
export function receiptFor(webhookId:string,deliveryId:string):string;
export function canonical(value:unknown):string;
