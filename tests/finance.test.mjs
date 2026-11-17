import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../src/js/config.js';
import { aggregateAccounts } from '../src/js/services/banking.js';
import { derivePlan, repayment, monthsToGoal } from '../src/js/calculators/finance.js';

function sampleState() {
  const state = structuredClone(DEFAULT_STATE);
  state.permissions.sampleData = true;
  state.accounts = [
    { id: 'everyday', allocation: 50 },
    { id: 'savings', allocation: 100 },
  ];
  return state;
}

test('Three-month aggregation excludes transfers and honours balance allocations', () => {
  const data = aggregateAccounts(sampleState().accounts);
  assert.equal(data.income, 6200);
  assert.equal(data.expenses, 3800);
  assert.equal(data.rent, 1500);
  assert.equal(data.saved, 42500);
  assert.equal(data.balance, 46500);
});

test('Automatic savings and target timeline use derived account data', () => {
  const plan = derivePlan(sampleState());
  assert.equal(plan.target, 145000);
  assert.equal(plan.monthly, 1800);
  assert.equal(plan.months, 57);
  assert.equal(plan.scenarioMonths, 46);
  assert.equal(plan.principal, 520000);
});

test('A new fictional snapshot updates salary, saved balance and timeline together', () => {
  const state = sampleState();
  state.snapshot = 1;
  const plan = derivePlan(state);
  assert.equal(plan.income, 6400);
  assert.equal(plan.saved, 44300);
  assert.equal(plan.monthly, 2000);
  assert.equal(plan.months, 51);
});

test('Withdrawing bank permission removes every sample contribution', () => {
  const state = sampleState();
  state.permissions.sampleData = false;
  const plan = derivePlan(state);
  assert.equal(plan.income, 0);
  assert.equal(plan.saved, 0);
  assert.equal(plan.monthly, 0);
  assert.equal(plan.months, Infinity);
});

test('Disconnecting everyday account removes its cash flow but retains allocated savings', () => {
  const state = sampleState();
  state.accounts = [{ id: 'savings', allocation: 100 }];
  const plan = derivePlan(state);
  assert.equal(plan.income, 0);
  assert.equal(plan.saved, 38500);
  assert.equal(plan.months, Infinity);
});

test('Repayment matches a reference amortisation case and handles zero interest', () => {
  assert.ok(Math.abs(repayment(500000, 6, 30) - 2997.7526257637845) < 0.00001);
  assert.equal(repayment(120000, 0, 10), 1000);
  assert.equal(repayment(0, 6, 30), 0);
});

test('Pass-through is conditional, not equality between cash rate and mortgage rate', () => {
  const state = sampleState();
  state.mortgage.change = -0.5;
  state.mortgage.passThrough = 50;
  assert.equal(derivePlan(state).scenarioRate, 6);
  state.mortgage.rate = 0;
  assert.equal(derivePlan(state).scenarioRate, 0);
});

test('Post-purchase budget replaces rent and does not double-count savings contribution', () => {
  const plan = derivePlan(sampleState());
  assert.equal(plan.nonRentExpenses, 2300);
  assert.equal(plan.afterPurchase, 6200 - 2300 - 350 - plan.baseRepayment);
});

test('Manual inputs and impossible budgets remain explicit', () => {
  const state = sampleState();
  state.mode = 'manual';
  state.manual = { income: 3000, expenses: 2500, rent: 1000, saved: 150000, monthly: 1000 };
  const plan = derivePlan(state);
  assert.equal(plan.surplus, -500);
  assert.equal(plan.months, 0);
  assert.equal(plan.progress, 100);
  assert.equal(monthsToGoal(100, 0), Infinity);
  assert.equal(monthsToGoal(0, 0), 0);
});
