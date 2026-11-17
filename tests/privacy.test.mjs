import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, STORAGE_KEY } from '../src/js/config.js';

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) || null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
const { sanitiseState, updateState, clearAllData, getState } =
  await import('../src/js/state/store.js');

test('Session-only changes do not write planning data to storage', () => {
  clearAllData();
  updateState((state) => {
    state.goal.price = 800000;
  });
  assert.equal(memory.has(STORAGE_KEY), false);
});

test('Remember is opt-in; withdrawal removes the stored plan immediately', () => {
  updateState((state) => {
    state.permissions.remember = true;
  });
  assert.equal(JSON.parse(memory.get(STORAGE_KEY)).goal.price, 800000);
  updateState((state) => {
    state.permissions.remember = false;
  });
  assert.equal(memory.has(STORAGE_KEY), false);
  assert.equal(getState().goal.price, 800000);
});

test('Clear removes old and new keys and resets consent and account state', () => {
  memory.set('homeready-v1', 'old');
  updateState((state) => {
    state.permissions.remember = true;
  });
  clearAllData();
  assert.equal(memory.size, 0);
  assert.equal(getState().onboarding, false);
  assert.equal(getState().permissions.sampleData, false);
});

test('Malformed, stale and out-of-range stored input is rejected', () => {
  assert.deepEqual(sanitiseState(null), DEFAULT_STATE);
  assert.deepEqual(sanitiseState({ version: 1 }), DEFAULT_STATE);
  const candidate = structuredClone(DEFAULT_STATE);
  candidate.permissions.remember = true;
  candidate.permissions.sampleData = false;
  candidate.goal.price = -3;
  candidate.mortgage.rate = 900;
  candidate.accounts = [{ id: 'everyday', allocation: 100 }];
  const clean = sanitiseState(candidate);
  assert.equal(clean.goal.price, DEFAULT_STATE.goal.price);
  assert.equal(clean.mortgage.rate, DEFAULT_STATE.mortgage.rate);
  assert.deepEqual(clean.accounts, []);
});
