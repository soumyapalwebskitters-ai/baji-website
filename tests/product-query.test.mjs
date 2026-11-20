import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
import { resolveCart } from '../src/lib/commerce.ts';
import { recaptchaFailure } from '../src/lib/recaptcha.ts';
const compile = path => ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const profiles={};vm.runInNewContext(compile('../src/lib/customer-profiles.ts'),{exports:profiles,require:()=>({}),Error});
const source=compile('../src/app/api/product-query/route.ts');
const valid={id:'b57ec22f-69dd-40e1-8c60-517232b875aa',token:'captcha',contact:{name:'Customer',phone:'+919876543210',email:'',location:''},cart:[{variantId:'box',quantity:2}]};
const catalog={products:[{id:'p1',name:'Sparklers',variants:[{id:'box',name:'Box',sku:'B1',price:2.5,itemsPerBox:10,sellingUnit:'box'}]}],seller:{whatsapp:''}};
function fixture({captcha={},dbFailure=false,configured=true}={}){
 const rows=new Map();const writes=[];let catalogCalls=0;const exports={};
 vm.runInNewContext(source,{exports,console:{warn(){}},Response,URL,URLSearchParams,AbortSignal,TextEncoder,crypto:webcrypto,Error,process:{env:configured?{RECAPTCHA_SECRET_KEY:'secret'}:{}},require:name=>({
  '@/lib/catalog':{getCatalog:async()=>{catalogCalls++;return catalog}},'@/lib/commerce':{resolveCart},'@/lib/recaptcha':{recaptchaFailure},'@/lib/customer-profiles':{parseCustomerProfile:profiles.parseCustomerProfile},
  '@/lib/product-queries':{findProductQuery:async id=>{if(dbFailure)throw new Error('offline');return rows.get(id)},saveProductQuery:async(id,hash,contact,items,total)=>{if(dbFailure)throw new Error('offline');writes.push({id,contact,items,total});const saved={id,request_hash:hash,estimated_total_minor:total,created_at:'2026-11-20'};if(!rows.has(id))rows.set(id,saved);return rows.get(id)}}
 })[name],fetch:async()=>Response.json({success:true,action:'place_query',hostname:'shop.example',score:.9,challenge_ts:new Date().toISOString(),...captcha})});
 return {writes,rows,catalogCalls:()=>catalogCalls,post:(body=valid,origin='https://shop.example')=>exports.POST(new Request('https://shop.example/api/product-query',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}))};
}
test('query saves authoritative product details and returns the requested success message',async()=>{const f=fixture();const response=await f.post({...valid,total:1,cart:[{...valid.cart[0],price:0}]});assert.equal(response.status,200);assert.deepEqual(await response.json(),{queryId:valid.id,message:'we will contact you soon'});assert.equal(f.writes[0].total,5000);assert.equal(f.writes[0].items[0].productName,'Sparklers');assert.equal(f.writes[0].items[0].quantity,2);assert.equal(f.writes[0].items[0].unitPriceMinor,2500);});
test('retry does not duplicate a saved query and changed payload cannot reuse its reference',async()=>{const f=fixture();assert.equal((await f.post()).status,200);assert.equal((await f.post()).status,200);assert.equal(f.writes.length,1);assert.equal(f.catalogCalls(),1);assert.equal((await f.post({...valid,contact:{...valid.contact,name:'Someone else'}})).status,409)});
test('invalid CAPTCHA, stale tokens and missing secret never write a query',async()=>{for(const options of [{captcha:{success:false}},{captcha:{action:'place_order'}},{captcha:{hostname:'other.example'}},{captcha:{score:.2}},{captcha:{challenge_ts:new Date(Date.now()-180000).toISOString()}},{configured:false}]){const f=fixture(options);assert.equal((await f.post()).status,options.configured===false?503:403);assert.equal(f.writes.length,0);assert.equal(f.catalogCalls(),0)}});
test('invalid carts and contact data are rejected',async()=>{for(const body of [{...valid,cart:[]},{...valid,cart:[valid.cart[0],valid.cart[0]]},{...valid,cart:[{variantId:'box',quantity:0}]},{...valid,contact:{...valid.contact,name:''}},{...valid,contact:{...valid.contact,email:'invalid'}},{...valid,cart:[{variantId:'deleted',quantity:1}]}]){const f=fixture();assert.equal((await f.post(body)).status,400);assert.equal(f.writes.length,0)}});
test('database failure returns an error and cross-origin requests are rejected',async()=>{const f=fixture({dbFailure:true});const response=await f.post();assert.equal(response.status,503);assert.match((await response.json()).error,/Unable to save/);assert.equal((await fixture().post(valid,'https://other.example')).status,403)});

test('CAPTCHA failures expose safe diagnostic codes without tokens or contact data',async()=>{for(const [captcha,reason] of [[{score:.1},'low-score'],[{hostname:'other.example'},'hostname-mismatch'],[{action:'place_order'},'action-mismatch'],[{success:false,'error-codes':['timeout-or-duplicate']},'expired-token'],[{success:false,'error-codes':['invalid-input-secret']},'configuration']]){const f=fixture({captcha});const response=await f.post();const body=await response.json();assert.equal(body.code,'recaptcha-'+reason);assert.match(body.reference,/^[a-f0-9-]{36}$/);assert.equal(f.writes.length,0);assert.equal(body.token,undefined);assert.equal(body.contact,undefined)}});
