import { deriveForecast } from '../forecasting/service.js';
import { derivePlan } from '../calculators/finance.js';
import { getState } from '../state/store.js';
import { $, money, duration, setText } from '../ui/helpers.js';

/** Transparent rule-based prototype. A future AI adapter belongs server-side. */
export function coachReply(question, state = getState()) {
  const plan = derivePlan(state);
  const text = question.toLowerCase();
  const amount = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);

  if (/forecast|predict|machine learning/.test(text)) {
    const forecast = deriveForecast(state, plan);
    if (!forecast.available) return forecast.reason;
    const methods = [forecast.income.selected, forecast.expenses.selected].map((name) =>
      name === 'ridge' ? 'Ridge regression' : 'a three-month average fallback',
    );
    return [
      `The locally trained forecasting pipeline estimates ${money(forecast.total)} net cash over the next six months after your protected buffer. Income uses ${methods[0]}; expenses use ${methods[1]}.`,
      'This explanation uses the base forecast, with no additional expense shock. Open AI Forecast for the scenario, validation errors and stress range.',
      'The history is synthetic. The forecasting model fits coefficients from data, while this coach explains its outputs using templates; it is not an LLM. The original home-plan timeline remains a constant-contribution scenario.',
    ].join('\n\n');
  }

  if (amount && /save|saving/.test(text)) {
    const extra = Number(amount[1].replaceAll(',', ''));
    if (!Number.isFinite(extra) || extra > 100000) {
      return 'Try a smaller additional contribution, for example $100 per week.';
    }
    const period = /month/.test(text) ? 'month' : 'week';
    const monthly = period === 'month' ? extra : (extra * 52) / 12;
    const contribution = plan.monthly + monthly;
    const months =
      plan.remaining <= 0
        ? 0
        : contribution > 0
          ? Math.ceil(plan.remaining / contribution)
          : Infinity;
    const budget =
      monthly <= plan.surplus
        ? `It fits your current surplus and leaves ${money(plan.surplus - monthly)} per month.`
        : `It needs ${money(monthly - plan.surplus)} more than your available monthly surplus. Keep it as a scenario until your budget changes.`;
    return [
      `${money(extra)} more per ${period} means ${money(monthly)} extra each month. Your savings timeline becomes ${duration(months)}.`,
      budget,
    ].join('\n\n');
  }

  if (/rate|interest/.test(text)) {
    return [
      `Your target loan is ${money(plan.principal)}. At an illustrative ${state.mortgage.rate.toFixed(2)}% over ${state.mortgage.years} years, repayments are ${money(plan.baseRepayment)} per month.`,
      `Your selected scenario gives ${money(plan.scenarioRepayment)} per month.`,
      'ASX tracks market expectations for the RBA cash rate. A lender’s mortgage rate is different, so Rate Lab uses an explicit pass-through assumption. No live ASX data is connected.',
    ].join('\n\n');
  }

  if (/travel|holiday/.test(text)) {
    return [
      'Travel is included in the fictional everyday account’s expenses at $300 per month. Automatic planning subtracts those expenses before allocating home savings.',
      `Your current plan puts ${money(plan.monthly)} toward home each month and leaves ${money(plan.surplus)} unallocated.`,
      'You can change the protected monthly buffer in My home plan without removing the travel budget.',
    ].join('\n\n');
  }

  if (/privacy|data/.test(text)) {
    return [
      'Inputs are processed in this browser. They are stored across visits only if you opt in to “Remember on this device”.',
      'Turn storage off, disconnect samples, export or clear data in Privacy & control.',
      'This coach does not send messages to an AI service. Hosted-page access is handled separately by the hosting platform.',
    ].join('\n\n');
  }

  if (/plan|explain|goal|automatic/.test(text)) {
    const method =
      state.mode === 'automatic'
        ? 'The automatic contribution is selected accounts’ average monthly income minus expenses and your protected buffer. Own-account transfers are excluded.'
        : 'Your plan uses the manual financial assumptions you entered.';
    return [
      `${money(state.goal.price)} × ${state.goal.deposit}% deposit + ${money(state.goal.costs)} cost buffer = ${money(plan.target)} savings goal.`,
      `You have ${money(plan.saved)} allocated, leaving ${money(plan.remaining)}. At ${money(plan.monthly)} each month, your timeline is ${duration(plan.months)}.`,
      method,
    ].join('\n\n');
  }

  return [
    'I can explain your plan, compare extra savings, explain rates or describe privacy controls.',
    'Try “Explain my plan”, “Save $100 more per week” or “What if rates change?”.',
    'This is a guided demo, not a live AI conversation.',
  ].join('\n\n');
}

export function addMessage(text, role) {
  const bubble = document.createElement('div');
  bubble.className = `message ${role}`;
  bubble.textContent = text;
  $('messages').append(bubble);
  $('messages').scrollTop = $('messages').scrollHeight;
}

export function resetChat() {
  $('messages').replaceChildren();
  addMessage(
    [
      'A little clarity, on your terms.',
      'I can explain your plan, explore savings scenarios and walk you through the rate assumptions. What would you like to understand?',
    ].join(' '),
    'assistant',
  );
}

export function renderCoach(state, plan) {
  setText('coach-fund', money(plan.saved));
  setText('coach-monthly', money(plan.monthly));
  setText('coach-timeline', duration(plan.months));
}
