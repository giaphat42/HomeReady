import { $, duration, money, setText, targetDate } from '../ui/helpers.js';
import { hasStorageProblem } from '../state/store.js';
import { renderSavingsChart } from '../ui/chart.js';

export function renderDashboard(state, plan) {
  setText('hero-saved', money(plan.saved));
  setText('hero-target', money(plan.target));
  setText('hero-location', state.goal.location);
  setText('hero-price', money(state.goal.price));
  setText('hero-progress', `${plan.progress.toFixed(1)}% funded`);
  setText('hero-remaining', `${money(plan.remaining)} remaining`);
  $('fund-progress').style.width = `${plan.progress}%`;
  setText('metric-income', money(plan.income));
  setText('metric-expenses', money(plan.expenses));
  setText('metric-saving', money(plan.monthly));
  setText('metric-time', duration(plan.months));
  setText('metric-date', targetDate(plan.months));
  setText(
    'source-label',
    state.mode === 'automatic'
      ? `${state.accounts.length} sample accounts · 3-month average`
      : 'Your manually entered assumptions',
  );
  setText('sync-label', state.mode === 'automatic' ? 'Automatic plan' : 'Manual plan');
  setText(
    'save-status',
    hasStorageProblem()
      ? 'Not saved · storage unavailable'
      : state.permissions.remember
        ? 'Saved on this device'
        : 'Session only · not saved',
  );
  setText(
    'hero-mode',
    state.mode === 'automatic'
      ? 'RECALCULATED FROM SAMPLE ACCOUNTS'
      : 'BASED ON YOUR MANUAL INPUTS',
  );
  setText(
    'next-title',
    plan.monthly > 0 ? 'Your money has a direction.' : 'Give your plan a starting point.',
  );
  setText(
    'next-description',
    plan.monthly > 0
      ? `${money(plan.monthly)} a month toward home, while keeping ${money(state.mode === 'automatic' ? state.goal.reserve : Math.max(0, plan.surplus))} of monthly breathing room.`
      : 'Connect fictional accounts or enter your own planning assumptions to create a savings timeline.',
  );
  setText('weekly-label', `+${money(state.scenario.weekly)}`);
  const savedMonths = plan.months - plan.scenarioMonths;
  setText(
    'scenario-headline',
    plan.remaining === 0
      ? 'Your savings goal is covered.'
      : !Number.isFinite(plan.scenarioMonths)
        ? 'Add savings to build a timeline.'
        : !Number.isFinite(plan.months)
          ? `${duration(plan.scenarioMonths)} to your goal`
          : savedMonths > 0
            ? `${savedMonths} months closer to home`
            : 'Your current timeline, with more saved',
  );
  setText(
    'scenario-detail',
    plan.surplus < plan.extra
      ? `This scenario needs ${money(plan.extra - plan.surplus)} more per month than your current surplus.`
      : `${money(plan.extra)} extra each month · ${money(plan.surplus - plan.extra)} remaining after savings`,
  );
  $('apply-extra').disabled =
    state.scenario.weekly === 0 || plan.remaining === 0 || plan.extra > plan.surplus;
  setText('rate-preview-payment', money(plan.baseRepayment));
  setText(
    'rate-preview-rate',
    `${state.mortgage.rate.toFixed(2)}% p.a. · ${state.mortgage.years} years`,
  );
  setText(
    'rate-preview-change',
    `${money(plan.scenarioRepayment - plan.baseRepayment, 0)} / month under your scenario`,
  );
  setText('connection-count', `${state.accounts.length} sample accounts connected`);
  setText(
    'budget-alert',
    plan.surplus < 0
      ? `Your savings plan exceeds your monthly surplus by ${money(-plan.surplus)}. Adjust your manual contribution.`
      : '',
  );
  $('budget-alert').hidden = plan.surplus >= 0;
  $('empty-auto').hidden = state.mode !== 'automatic' || state.accounts.length > 0;
  renderSavingsChart(plan);
}
