import { repayment } from '../calculators/finance.js';
import { $, money, percent, setText } from '../ui/helpers.js';

export function renderRates(state, plan) {
  const mortgage = state.mortgage;
  setText('loan-principal', money(plan.principal));
  setText(
    'loan-origin',
    `${money(state.goal.price)} property − ${money(plan.deposit)} target deposit`,
  );
  setText('base-rate', percent(mortgage.rate));
  setText('scenario-rate', percent(plan.scenarioRate));
  setText('base-payment', money(plan.baseRepayment));
  setText('scenario-payment', money(plan.scenarioRepayment));
  setText(
    'payment-delta',
    `${plan.scenarioRepayment >= plan.baseRepayment ? '+' : '−'}${money(Math.abs(plan.scenarioRepayment - plan.baseRepayment))} / month`,
  );
  setText(
    'rate-change-label',
    `${mortgage.change > 0 ? '+' : ''}${mortgage.change.toFixed(2)} percentage points`,
  );
  setText(
    'rate-equation',
    `${percent(mortgage.rate)} mortgage rate + (${mortgage.change.toFixed(2)} pp × ${mortgage.passThrough}% assumed pass-through) = ${percent(plan.scenarioRate)}`,
  );
  setText(
    'rate-floor',
    plan.scenarioRate === 0 ? 'The scenario mortgage rate is floored at 0%.' : '',
  );
  setText('purchase-income', money(plan.income));
  setText('purchase-living', money(plan.nonRentExpenses));
  setText('purchase-rent', `${money(plan.rent)} of rent removed from current expenses`);
  setText('purchase-ownership', money(mortgage.ownership));
  setText('purchase-left', money(plan.afterScenario));
  $('purchase-left').classList.toggle('warning-text', plan.afterScenario < 0);
  setText(
    'purchase-note',
    plan.afterScenario < 0
      ? 'This scenario runs above the entered monthly budget. It is not an assessment of borrowing eligibility.'
      : 'Illustrative cash left after the scenario mortgage and ownership-cost buffer. Pre-purchase savings contributions are excluded.',
  );
  setText('total-interest', money(plan.totalInterest));

  const changes = [-0.5, -0.25, 0, 0.25, 0.5, 1, 2];
  $('rates-table-body').innerHTML = changes
    .map((change) => {
      const rate = Math.max(0, mortgage.rate + change);
      const payment = repayment(plan.principal, rate, mortgage.years);
      const diff = payment - plan.baseRepayment;
      return `<tr class="${change === 0 ? 'baseline-row' : ''}">
        <td>${change === 0 ? 'Base case' : `${change > 0 ? '+' : ''}${change.toFixed(2)} pp`}</td>
        <td>${percent(rate)}</td>
        <td>${money(payment)}</td>
        <td>${diff === 0 ? '—' : `${diff > 0 ? '+' : '−'}${money(Math.abs(diff))}`}</td>
      </tr>`;
    })
    .join('');
}
