import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { validRecaptcha } from '../src/lib/recaptcha.ts';

const source = ts.transpileModule(readFileSync(new URL('../src/app/api/customer-auth/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const profileExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/customer-profiles.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {exports:profileExports, require:()=>({}), Error});
function fixture({ configured = true, replies = [], initial = {}, dbFailure = false, captcha = {}, captchaStatus = 200, captchaSecret = true, captchaFailure = false } = {}) {
  const jar = new Map(Object.entries(initial));
  const writes = [];
  const calls = [];
  const profileWrites = [];
  const exports = {};
  const store = { get: key => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key, value, options) => { jar.set(key, value); writes.push({ key, value, options }); }, delete: key => jar.delete(key) };
  vm.runInNewContext(source, { exports, require: name => name === '@/lib/recaptcha' ? { validRecaptcha } : name === 'next/headers' ? { cookies: async () => store } : { parseCustomerProfile: profileExports.parseCustomerProfile, saveCustomerProfile: async (id, profile) => { if (dbFailure) throw new Error('Database unavailable'); profileWrites.push({id,profile}); return profile; }, loadCustomerProfile: async () => ({name:'Test customer',email:'',location:''}) }, Error, Response, URL, URLSearchParams, AbortSignal,
    process: { env: configured ? { SUPABASE_URL: 'https://auth.example', SUPABASE_PUBLISHABLE_KEY: 'public-test-key', RECAPTCHA_SECRET_KEY: captchaSecret ? 'test-secret' : '' } : {} },
    fetch: async (url, options) => { if (url === 'https://www.google.com/recaptcha/api/siteverify') { if(captchaFailure) throw new Error('Unavailable'); return Response.json({success:true,action:`customer_login_${options.body.get('response').replace('captcha-','')}`,score:0.9,hostname:'shop.example',challenge_ts:new Date().toISOString(),...captcha},{status:captchaStatus}); } calls.push({ url, options }); const reply = replies.shift(); assert.ok(reply, 'Unexpected provider request'); return Response.json(reply.body, { status: reply.status || 200 }); },
  });
  const post = (body, origin = 'https://shop.example', host) => exports.POST(new Request('https://shop.example/api/customer-auth', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(host ? { Host: host } : {}) }, body: JSON.stringify({ ...(['send','verify'].includes(body.action) ? {name:'Test customer',email:'',location:'',recaptchaToken:`captcha-${body.action}`} : {}), ...body }) }));
  return { post, jar, writes, calls, profileWrites };
}
test('rejects cross-origin auth mutations before contacting provider', async () => {
  const f = fixture(); assert.equal((await f.post({ action: 'send', phone: '+919876543210' }, 'https://other.example')).status, 403); assert.equal(f.calls.length, 0);
});
test('missing configuration fails closed', async () => {
  const f = fixture({ configured: false }); assert.equal((await f.post({ action: 'send', phone: '+919876543210' })).status, 503); assert.equal(f.writes.length, 0);
});
test('rejects invalid phone numbers and OTPs without provider calls', async () => {
  const f = fixture(); assert.equal((await f.post({ action: 'send', phone: '123' })).status, 400); assert.equal((await f.post({ action: 'verify', phone: '+919876543210', code: 'abc' })).status, 400); assert.equal(f.calls.length, 0);
});
test('requests SMS without creating a local session', async () => {
  const f = fixture({ replies: [{ body: {} }] }); assert.equal((await f.post({ action: 'send', phone: '+919876543210' })).status, 200); assert.equal(JSON.parse(f.calls[0].options.body).channel, 'sms'); assert.equal(f.writes.length, 0);
});
test('incorrect code never sets session cookies', async () => {
  const f = fixture({ replies: [{ status: 403, body: { error: 'expired' } }] }); assert.equal((await f.post({ action: 'verify', phone: '+919876543210', code: '123456' })).status, 400); assert.equal(f.writes.length, 0);
});
test('verified OTP sets HTTP-only secure cookies and does not expose tokens', async () => {
  const f = fixture({ replies: [{ body: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { id:'customer-1', phone: '919876543210', phone_confirmed_at:'2026-11-20' } } }] });
  const response = await f.post({ action: 'verify', phone: '+919876543210', code: '123456' }); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { user: {name:'Test customer',phone:'+919876543210',email:'',location:''} }); assert.equal(f.writes.length, 2);
  for (const cookie of f.writes) { assert.equal(cookie.options.httpOnly, true); assert.equal(cookie.options.secure, true); assert.equal(cookie.options.sameSite, 'lax'); }
});
test('refreshes expired sessions and rotates cookies', async () => {
  const f = fixture({ initial: { baji_customer_refresh: 'old-refresh' }, replies: [{ body: { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600, user: { id:'customer-1', phone: '919876543210', phone_confirmed_at:'2026-11-20' } } }] });
  assert.equal((await f.post({ action: 'session' })).status, 200); assert.equal(f.jar.get('baji_customer_refresh'), 'new-refresh');
});
test('logout removes local session cookies', async () => {
  const f = fixture({ initial: { baji_customer_access: 'access', baji_customer_refresh: 'refresh' }, replies: [{ body: {} }] }); assert.equal((await f.post({ action: 'logout' })).status, 200); assert.equal(f.jar.size, 0);
});

test('accepts browser Host when Next.js uses an internal request hostname', async () => {
  const f = fixture({ configured: false });
  assert.equal((await f.post({ action: 'session' }, 'https://192.168.6.192:3000', '192.168.6.192:3000')).status, 503);
});
test('still rejects foreign origins and wrong ports with a LAN Host', async () => {
  const f = fixture();
  assert.equal((await f.post({ action: 'session' }, 'https://evil.example', '192.168.6.192:3000')).status, 403);
  assert.equal((await f.post({ action: 'session' }, 'https://192.168.6.192:4000', '192.168.6.192:3000')).status, 403);
  assert.equal(f.calls.length, 0);
});

test('name and number are required; optional email and location are validated before SMS', async () => {
  for (const data of [{name:''},{name:' '},{phone:'+441234567890'},{email:'invalid'},{location:'x'.repeat(201)}]) {
    const f=fixture();assert.equal((await f.post({action:'send',phone:'+919876543210',...data})).status,400);assert.equal(f.calls.length,0);assert.equal(f.profileWrites.length,0);
  }
});
test('verified profile is saved under the provider identity, not a supplied customer ID', async () => {
 const f=fixture({replies:[{body:{access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'verified-id',phone:'919876543210',phone_confirmed_at:'2026-11-20'}}}]});
 assert.equal((await f.post({action:'verify',phone:'+919876543210',code:'123456',name:'  Customer Name  ',email:'customer@example.com',location:'Kolkata',customer_id:'forged-id'})).status,200);
 assert.equal(f.profileWrites[0].id,'verified-id');assert.equal(f.profileWrites[0].profile.name,'Customer Name');assert.equal(f.profileWrites[0].profile.email,'customer@example.com');assert.equal(f.profileWrites[0].profile.location,'Kolkata');
});
test('database failure and mismatched verified phone never create a signed-in session', async () => {
 for(const options of [{dbFailure:true,phone:'919876543210',status:503},{dbFailure:false,phone:'919999999999',status:400}]) {
  const f=fixture({dbFailure:options.dbFailure,replies:[{body:{access_token:'access',refresh_token:'refresh',user:{id:'customer-1',phone:options.phone,phone_confirmed_at:'2026-11-20'}}}]});
  assert.equal((await f.post({action:'verify',phone:'+919876543210',code:'123456'})).status,options.status);assert.equal(f.writes.length,0);
 }
});
test('session reload includes private profile details only for the authenticated customer',async()=>{
 const f=fixture({initial:{baji_customer_access:'access'},replies:[{body:{id:'customer-1',phone:'919876543210',phone_confirmed_at:'2026-11-20'}}]});
 const body=await (await f.post({action:'session'})).json();assert.equal(body.user.name,'Test customer');assert.equal(body.user.phone,'919876543210');
});

test('login CAPTCHA rejects missing tokens without requesting SMS or saving profiles',async()=>{
 for(const recaptchaToken of ['',null,'x'.repeat(10001)]) {const f=fixture();assert.equal((await f.post({action:'send',phone:'+919876543210',recaptchaToken})).status,400);assert.equal(f.calls.length,0);assert.equal(f.profileWrites.length,0);}
});
test('login CAPTCHA fails closed for wrong action, host, low score, expiry and unavailable verification',async()=>{
 for(const action of ['send','verify']) for(const options of [
  {captcha:{success:false}},{captcha:{action:'place_order'}},{captcha:{hostname:'other.example'}},{captcha:{score:0.1}},
  {captcha:{challenge_ts:new Date(Date.now()-180000).toISOString()}},{captchaSecret:false},{captchaStatus:503},{captchaFailure:true}
 ]) {const f=fixture(options);const response=await f.post({action,phone:'+919876543210',code:'123456'});assert.equal(response.status,options.captchaSecret===false||options.captchaStatus||options.captchaFailure?503:403);assert.equal(f.calls.length,0);assert.equal(f.writes.length,0);assert.equal(f.profileWrites.length,0);}
});
