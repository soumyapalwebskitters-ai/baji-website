import test from 'node:test';
import assert from 'node:assert/strict';
import { validRecaptcha } from '../src/lib/recaptcha.ts';

const now = Date.now();
const valid = { success: true, action: 'place_order', score: 0.9, hostname: 'shop.example', challenge_ts: new Date(now - 1000).toISOString() };
test('accepts a recent checkout token for this hostname at the score threshold', () => {
  assert.equal(validRecaptcha(valid, 'shop.example', now), true);
  assert.equal(validRecaptcha({ ...valid, score: 0.5 }, 'shop.example', now), true);
});
test('rejects failed, wrong-action, wrong-host, low-score, expired and malformed responses', () => {
  for (const value of [null, {}, { ...valid, success: false }, { ...valid, action: 'login' }, { ...valid, hostname: 'other.example' }, { ...valid, score: 0.49 }, { ...valid, score: '0.9' }, { ...valid, score: 2 }, { ...valid, challenge_ts: 'invalid' }, { ...valid, challenge_ts: new Date(now - 121000).toISOString() }, { ...valid, challenge_ts: new Date(now + 60000).toISOString() }]) {
    assert.equal(validRecaptcha(value, 'shop.example', now), false);
  }
});
