import { forecastHistory } from './history.js';
import { forecastCashFlow } from './model.js';

/** Permission and mode checks apply before any history is processed. */
export function deriveForecast(state, plan, expenseShock = 0) {
  if (!state.permissions.sampleData)
    return {
      available: false,
      reason: 'Allow fictional account data in Connected accounts to explore the forecasting demo.',
    };
  if (state.mode !== 'automatic')
    return {
      available: false,
      reason:
        'Switch My home plan to Automatic to forecast from connected sample history. A single manual balance is not enough to train a model.',
    };
  if (!state.accounts.some((account) => ['everyday', 'side'].includes(account.id)))
    return {
      available: false,
      reason:
        'Connect a sample account with income and expense history. Savings transfers alone cannot support a cash-flow forecast.',
    };
  const result = forecastCashFlow(forecastHistory(state.accounts, state.snapshot), {
    reserve: state.goal.reserve,
    saved: plan.saved,
    expenseShock,
  });
  return { available: true, ...result };
}
