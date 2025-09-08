import test from 'node:test';
import assert from 'node:assert/strict';
import { humanTime, clamp, bytesHuman } from '../src/utils.js';

test('humanTime formats seconds', () => {
  assert.equal(humanTime(0), '0:00');
  assert.equal(humanTime(65), '1:05');
});

test('clamp limits values', () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1, 0, 3), 0);
});

test('bytesHuman converts bytes to human-readable form', () => {
  assert.equal(bytesHuman(500), '500 B');
  assert.equal(bytesHuman(1024), '1.00 KB');
});
