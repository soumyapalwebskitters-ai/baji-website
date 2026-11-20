import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/app/api/reviews/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const validReview = { name: 'Customer', quote: 'A lovely celebration with the family.', rating: 5 };
function fixture({ token = 'access', status = 200, customer = { id: 'verified-user', phone_confirmed_at: '2026-11-20' }, dbFailure = false } = {}) {
  const exports = {}, queries = [], bindings = [];
  const db = { prepare(sql) { if (dbFailure) throw new Error('offline'); queries.push(sql); return { all: async () => ({ results: [] }), bind(...args) { bindings.push(args); return { first: async () => ({ id: args[0], name: args[2], rating: args[3], quote: args[4] }) }; } }; } };
  vm.runInNewContext(source, { exports, Response, URL, AbortSignal, crypto: webcrypto,
    process: { env: { SUPABASE_URL: 'https://auth.example', SUPABASE_PUBLISHABLE_KEY: 'public' } },
    require: name => name === 'next/headers' ? { cookies: async () => ({ get: () => token ? { value: token } : undefined }) } : { getCloudflareContext: async () => ({ env: { REVIEWS_DB: db } }) },
    fetch: async () => Response.json(customer, { status }),
  });
  return { exports, queries, bindings, post: (body = validReview, origin = 'https://shop.example') => exports.POST(new Request('https://shop.example/api/reviews', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })) };
}
test('anonymous users cannot publish reviews', async () => { const f = fixture({ token: null }); assert.equal((await f.post()).status, 401); assert.equal(f.queries.length, 0); });
test('cross-origin writes are rejected', async () => { const f = fixture(); assert.equal((await f.post(validReview, 'https://evil.example')).status, 403); assert.equal(f.queries.length, 0); });
test('invalid sessions and unverified phone users cannot write', async () => { for (const options of [{ status: 401 }, { customer: { id: 'user' } }]) { const f = fixture(options); assert.equal((await f.post()).status, 401); assert.equal(f.queries.length, 0); } });
test('invalid review fields never reach D1', async () => { for (const body of [{ ...validReview, rating: 6 }, { ...validReview, quote: 'short' }, { ...validReview, name: '' }]) { const f = fixture(); assert.equal((await f.post(body)).status, 400); assert.equal(f.queries.length, 0); } });
test('uses verified identity instead of client-supplied IDs and parameterizes text', async () => {
  const f = fixture(); const response = await f.post({ ...validReview, customer_id: 'attacker-chosen', name: "O'Neil" });
  assert.equal(response.status, 200); assert.equal(f.bindings[0][1], 'verified-user'); assert.equal(f.bindings[0][2], "O'Neil"); assert.ok(f.queries[0].includes('ON CONFLICT(customer_id) DO UPDATE')); assert.ok(!f.queries[0].includes("O'Neil")); const result = await response.json(); assert.equal(result.review.customer_id, undefined); assert.equal(result.review.phone, undefined);
});
test('public list excludes customer identity and limits results', async () => { const f = fixture({ token: null }); assert.equal((await f.exports.GET()).status, 200); assert.ok(!f.queries[0].includes('customer_id')); assert.ok(!f.queries[0].includes('phone')); assert.ok(f.queries[0].includes('LIMIT 50')); });
test('database failure is not reported as a saved review', async () => { const f = fixture({ dbFailure: true }); assert.equal((await f.post()).status, 503); });
