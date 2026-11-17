import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../src/js/config.js';
import { derivePlan } from '../src/js/calculators/finance.js';
import { forecastHistory } from '../src/js/forecasting/history.js';
import {
  compareModels,
  fitRidge,
  forecastCashFlow,
  validateHistory,
  nextMonth,
} from '../src/js/forecasting/model.js';
import { deriveForecast } from '../src/js/forecasting/service.js';
import { aggregateAccounts } from '../src/js/services/banking.js';

const accounts = [
  { id: 'everyday', allocation: 50 },
  { id: 'savings', allocation: 100 },
];
const history = () => forecastHistory(accounts);
function state() {
  const value = structuredClone(DEFAULT_STATE);
  value.permissions.sampleData = true;
  value.accounts = accounts;
  value.mode = 'automatic';
  return value;
}

test('Expanded synthetic history reconciles to the existing snapshot for all account combinations', () => {
  for (const selected of [
    accounts,
    [{ id: 'side', allocation: 100 }],
    [...accounts, { id: 'side', allocation: 100 }],
  ]) {
    for (const snapshot of [0, 1]) {
      const rows = forecastHistory(selected, snapshot);
      validateHistory(rows);
      const bank = aggregateAccounts(selected, snapshot);
      for (const key of ['income', 'expenses']) {
        assert.ok(
          Math.abs(rows.slice(-3).reduce((sum, row) => sum + row[key], 0) / 3 - bank[key]) < 1e-8,
        );
      }
    }
  }
});

test('Ridge learns changed targets rather than returning fixture predictions', () => {
  const rows = history();
  const original = fitRidge(rows, 'income');
  const shifted = fitRidge(
    rows.map((row) => ({ ...row, income: row.income + 1000 })),
    'income',
  );
  assert.ok(Math.abs(shifted.predict('2026-12') - original.predict('2026-12') - 1000) < 1e-6);
  assert.notDeepEqual(original.coefficients, shifted.coefficients);
});

test('Rolling validation cannot see its target or any later month', () => {
  const rows = history();
  const original = compareModels(rows, 'income');
  const changed = rows.map((row, i) => ({ ...row, income: row.income + (i >= 33 ? 5000 : 0) }));
  const modified = compareModels(changed, 'income');
  for (let i = 0; i <= 3; i++) {
    assert.equal(original.folds[i].ridge, modified.folds[i].ridge);
    assert.equal(original.folds[i].baseline, modified.folds[i].baseline);
    assert.ok(original.folds[i].trainThrough < original.folds[i].month);
  }
  assert.equal(original.folds.length, 6);
});

test('Selection reports measured errors and prefers a constant baseline on a tie', () => {
  const constant = history().map((row) => ({ ...row, income: 5000, expenses: 3000 }));
  const result = compareModels(constant, 'income');
  assert.equal(result.selected, 'baseline');
  assert.equal(result.baselineMae, 0);
  const fitted = compareModels(history(), 'expenses');
  assert.equal(fitted.selected, fitted.ridgeMae < fitted.baselineMae - 0.01 ? 'ridge' : 'baseline');
});

test('Forecast obeys cash-flow arithmetic, retains deficits and widens its stress range', () => {
  const base = forecastCashFlow(history(), { reserve: 600, saved: 42500 });
  const shocked = forecastCashFlow(history(), { reserve: 600, saved: 42500, expenseShock: 5000 });
  assert.equal(base.rows.length, 6);
  assert.ok(Math.abs(base.total - shocked.total - 30000) < 1e-7);
  assert.ok(shocked.rows.every((row) => row.net < 0));
  for (const row of base.rows) {
    assert.ok(Math.abs(row.net - (row.income - row.expenses - 600)) < 1e-8);
    assert.ok(row.lower <= row.net && row.upper >= row.net);
  }
  assert.ok(base.rows[5].upper - base.rows[5].lower > base.rows[0].upper - base.rows[0].lower);
  assert.ok(Math.abs(base.rows.at(-1).balance - 42500 - base.total) < 1e-7);
});

test('Permission withdrawal, manual mode and transfer-only accounts suppress model output', () => {
  const s = state();
  assert.equal(deriveForecast(s, derivePlan(s)).available, true);
  s.permissions.sampleData = false;
  assert.equal(deriveForecast(s, derivePlan(s)).available, false);
  s.permissions.sampleData = true;
  s.mode = 'manual';
  assert.equal(deriveForecast(s, derivePlan(s)).available, false);
  s.mode = 'automatic';
  s.accounts = [{ id: 'savings', allocation: 100 }];
  assert.equal(deriveForecast(s, derivePlan(s)).available, false);
});

test('History, snapshot, balance allocation and buffer changes reach the forecast', () => {
  const s = state();
  const before = deriveForecast(s, derivePlan(s));
  s.snapshot = 1;
  const after = deriveForecast(s, derivePlan(s));
  assert.notEqual(before.total, after.total);
  assert.equal(after.rows[0].month, '2026-12');
  s.goal.reserve += 100;
  const buffered = deriveForecast(s, derivePlan(s));
  assert.ok(Math.abs(after.total - buffered.total - 600) < 1e-7);
  s.accounts = [
    { id: 'everyday', allocation: 0 },
    { id: 'savings', allocation: 0 },
  ];
  const zero = deriveForecast(s, derivePlan(s));
  assert.ok(Math.abs(zero.rows.at(-1).balance - zero.total) < 1e-7);
});

test('Reject short, missing, duplicate and invalid histories instead of fabricating forecasts', () => {
  assert.throws(() => forecastCashFlow(history().slice(-3)), /30 consecutive/);
  const missing = history();
  missing.splice(10, 1);
  assert.throws(() => forecastCashFlow(missing), /consecutive/);
  const duplicate = history();
  duplicate[2].month = duplicate[1].month;
  assert.throws(() => forecastCashFlow(duplicate), /consecutive/);
  const invalid = history();
  invalid[0].income = NaN;
  assert.throws(() => forecastCashFlow(invalid), /finite/);
  assert.throws(() => forecastCashFlow(history(), { reserve: -1 }), /non-negative/);
  assert.equal(nextMonth('2026-12', 1), '2027-01');
});

// Independently calculated with NumPy solve(X.T @ X + diag(0,1,1,1,1), X.T @ y).
test('Ridge matches an independent linear-algebra reference', () => {
  const prediction = fitRidge(history(), 'income').predict('2026-12');
  assert.ok(Math.abs(prediction - 6309.122249229946) < 1e-7);
});
