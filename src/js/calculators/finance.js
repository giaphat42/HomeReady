import { aggregateAccounts } from '../services/banking.js';

/** Standard monthly principal-and-interest repayment; no fees, offset or interest-only period. */
export function repayment(principal, annualRate, years) {
  const months = years * 12;
  if (principal <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const rate = annualRate / 100 / 12;
  return (principal * rate) / (1 - Math.pow(1 + rate, -months));
}

export function monthsToGoal(remaining, monthly) {
  if (remaining <= 0) return 0;
  return monthly > 0 ? Math.ceil(remaining / monthly) : Infinity;
}

/** Single derived model for every screen: changing any input updates all dependent outputs. */
export function derivePlan(state) {
  const bank = aggregateAccounts(
    state.permissions.sampleData ? state.accounts : [],
    state.snapshot,
  );
  const automatic = state.mode === 'automatic';
  const financial = automatic ? bank : state.manual;
  const monthly = automatic
    ? Math.max(0, bank.income - bank.expenses - state.goal.reserve)
    : state.manual.monthly;
  const deposit = (state.goal.price * state.goal.deposit) / 100;
  const target = deposit + state.goal.costs;
  const remaining = Math.max(0, target - financial.saved);
  const extra = (state.scenario.weekly * 52) / 12;
  const principal = Math.max(0, state.goal.price - deposit);
  const baseRepayment = repayment(principal, state.mortgage.rate, state.mortgage.years);
  const scenarioRate = Math.max(
    0,
    state.mortgage.rate + (state.mortgage.change * state.mortgage.passThrough) / 100,
  );
  const scenarioRepayment = repayment(principal, scenarioRate, state.mortgage.years);
  const nonRentExpenses = Math.max(0, financial.expenses - financial.rent);

  return {
    ...financial,
    bank,
    automatic,
    monthly,
    deposit,
    target,
    remaining,
    extra,
    principal,
    months: monthsToGoal(remaining, monthly),
    scenarioMonths: monthsToGoal(remaining, monthly + extra),
    progress: Math.min(100, (financial.saved / target) * 100),
    surplus: financial.income - financial.expenses - monthly,
    baseRepayment,
    scenarioRate,
    scenarioRepayment,
    nonRentExpenses,
    afterPurchase: financial.income - nonRentExpenses - state.mortgage.ownership - baseRepayment,
    afterScenario:
      financial.income - nonRentExpenses - state.mortgage.ownership - scenarioRepayment,
    totalInterest: Math.max(0, baseRepayment * state.mortgage.years * 12 - principal),
  };
}
