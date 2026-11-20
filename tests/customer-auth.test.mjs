import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/app/api/customer-auth/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture({ configured = true, replies = [], initial = {} } = {}) {
  const jar = new Map(Object.entries(initial));
  const writes = [];
  const calls = [];
  const exports = {};
  const store = { get: key => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key, value, options) => { jar.set(key, value); writes.push({ key, value, options }); }, delete: key => jar.delete(key) };
  vm.runInNewContext(source, { exports, require: () => ({ cookies: async () => store }), Response, URL, AbortSignal,
    process: { env: configured ? { SUPABASE_URL: 'https://auth.example', SUPABASE_PUBLISHABLE_KEY: 'public-test-key' } : {} },
    fetch: async (url, options) => { calls.push({ url, options }); const reply = replies.shift(); assert.ok(reply, 'Unexpected provider request'); return Response.json(reply.body, { status: reply.status || 200 }); },
  });
  const post = (body, origin = 'https://shop.example', host) => exports.POST(new Request('https://shop.example/api/customer-auth', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(host ? { Host: host } : {}) }, body: JSON.stringify(body) }));
  return { post, jar, writes, calls };
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
  const f = fixture({ replies: [{ body: { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { phone: '919876543210' } } }] });
  const response = await f.post({ action: 'verify', phone: '+919876543210', code: '123456' }); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { user: { phone: '919876543210' } }); assert.equal(f.writes.length, 2);
  for (const cookie of f.writes) { assert.equal(cookie.options.httpOnly, true); assert.equal(cookie.options.secure, true); assert.equal(cookie.options.sameSite, 'lax'); }
});
test('refreshes expired sessions and rotates cookies', async () => {
  const f = fixture({ initial: { baji_customer_refresh: 'old-refresh' }, replies: [{ body: { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600, user: { phone: '919876543210' } } }] });
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
