import { $, money, duration, targetDate, setText } from '../ui/helpers.js';

export function renderPlan(state, plan) {
  $('manual-inputs').hidden = state.mode !== 'manual';
  $('automatic-explanation').hidden = state.mode !== 'automatic';
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.mode === state.mode);
    button.setAttribute('aria-pressed', button.dataset.mode === state.mode);
  });
  setText('plan-income', money(plan.income));
  setText('plan-expenses', money(plan.expenses));
  setText('plan-reserve', money(state.goal.reserve));
  setText('plan-monthly', money(plan.monthly));
  setText('plan-target', money(plan.target));
  setText('plan-deposit', money(plan.deposit));
  setText('plan-costs', money(state.goal.costs));
  setText('plan-remaining', money(plan.remaining));
  setText('plan-time', duration(plan.months));
  setText('plan-date', targetDate(plan.months));
  setText(
    'plan-budget',
    plan.surplus >= 0
      ? `${money(plan.surplus)} left after living expenses and planned savings.`
      : `${money(-plan.surplus)} above your current monthly surplus.`,
  );
  $('plan-budget').classList.toggle('warning-text', plan.surplus < 0);
}
