import { $, money, setText, downloadJson } from '../ui/helpers.js';
import { deriveForecast } from '../forecasting/service.js';

let expenseShock = 0;
let currentReport = null;
const method = (value) => (value === 'ridge' ? 'Ridge regression' : '3-month mean (fallback)');
const label = (month) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function resetForecast() {
  expenseShock = 0;
  currentReport = null;
  $('forecast-shock').value = '0';
}
export function bindForecast(refresh) {
  $('forecast-shock').addEventListener('input', (event) => {
    if (!event.target.checkValidity() || event.target.value === '') return;
    expenseShock = Number(event.target.value);
    refresh();
  });
  $('forecast-export').addEventListener('click', () => {
    if (currentReport) downloadJson(currentReport, 'HomeReady-forecast-report.json');
  });
}

function renderChart(rows) {
  const width = 720,
    height = 255,
    left = 70,
    top = 22,
    bottom = 210;
  const min = Math.min(0, ...rows.map((row) => row.lower));
  const max = Math.max(1, ...rows.map((row) => row.upper));
  const y = (value) => bottom - ((value - min) / (max - min)) * (bottom - top);
  const x = (index) => left + index * 116;
  const line = rows.map((row, i) => `${x(i)},${y(row.net)}`).join(' ');
  const area = [
    ...rows.map((row, i) => `${x(i)},${y(row.upper)}`),
    ...rows.map((row, i) => `${x(i)},${y(row.lower)}`).reverse(),
  ].join(' ');
  $('forecast-chart').innerHTML =
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Six monthly cash-flow forecasts with an illustrative stress range. Exact values are in the table below.">
    ${[min, (min + max) / 2, max].map((value) => `<line x1="${left}" y1="${y(value)}" x2="670" y2="${y(value)}" stroke="#e2e4da"/><text x="58" y="${y(value) + 4}" text-anchor="end">${Math.round(value).toLocaleString('en-AU')}</text>`).join('')}
    <line x1="${left}" y1="${y(0)}" x2="670" y2="${y(0)}" stroke="#9b513c" stroke-dasharray="3 5"/>
    <polygon points="${area}" fill="#b49b6e" opacity="0.18"/>
    <polyline points="${line}" fill="none" stroke="#18392f" stroke-width="3"/>
    ${rows.map((row, i) => `<circle cx="${x(i)}" cy="${y(row.net)}" r="4" fill="#18392f"/><text x="${x(i)}" y="240" text-anchor="middle">${label(row.month)}</text>`).join('')}
  </svg>`;
}

export function renderForecast(state, plan) {
  const forecast = deriveForecast(state, plan, expenseShock);
  $('forecast-empty').hidden = forecast.available;
  $('forecast-content').hidden = !forecast.available;
  $('forecast-export').disabled = !forecast.available;
  if (!forecast.available) {
    currentReport = null;
    setText('forecast-empty', forecast.reason);
    setText('plan-forecast-summary', forecast.reason);
    $('forecast-table').replaceChildren();
    $('forecast-validation').replaceChildren();
    $('forecast-chart').replaceChildren();
    return;
  }
  const { rows, income, expenses, history, total } = forecast;
  const last = rows.at(-1);
  setText(
    'forecast-period',
    `36 synthetic months · ${label(history[0].month)} – ${label(history.at(-1).month)}`,
  );
  setText('forecast-net', money(total));
  setText('forecast-balance', money(last.balance));
  setText('forecast-range', `${money(last.lowerBalance)} to ${money(last.upperBalance)}`);
  setText('forecast-gap', money(Math.max(0, plan.target - last.balance)));
  setText(
    'forecast-next',
    `${money(rows[0].net)} available next month after your ${money(state.goal.reserve)} buffer.`,
  );
  setText(
    'forecast-selection',
    `Income: ${method(income.selected)}. Expenses: ${method(expenses.selected)}.`,
  );
  setText(
    'forecast-compare',
    `Constant-contribution scenario: ${money(plan.monthly * 6)} over six months. Forecast difference: ${money(total - plan.monthly * 6)}.`,
  );
  setText(
    'plan-forecast-summary',
    `Six-month forecast: ${money(total)} net cash available after your buffer; projected home fund ${money(last.balance)}. Includes ${money(expenseShock)} extra monthly expenses in the Forecast scenario. Synthetic history, with model validation and a stress range.`,
  );
  setText(
    'forecast-risk',
    rows.some((row) => row.net < 0)
      ? 'A projected monthly shortfall could draw down your home fund. Negative balances indicate an unfunded gap, not an overdraft facility.'
      : 'Positive cash flow assumes all remaining money is saved. The stress range can still include shortfalls; it is not a guaranteed outcome.',
  );
  renderChart(rows);
  $('forecast-table').replaceChildren();
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const value of [
      label(row.month),
      money(row.income),
      money(row.expenses),
      money(row.net),
      money(row.balance),
    ]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    $('forecast-table').append(tr);
  }
  $('forecast-validation').replaceChildren();
  for (const [name, score] of [
    ['Income', income],
    ['Expenses', expenses],
  ]) {
    const tr = document.createElement('tr');
    for (const value of [
      name,
      money(score.ridgeMae),
      money(score.baselineMae),
      method(score.selected),
    ]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    $('forecast-validation').append(tr);
  }
  currentReport = {
    modelVersion: 'homeready-ridge-1',
    generatedAt: new Date().toISOString(),
    provenance:
      '36 synthetic monthly records; last three reconcile with connected sample accounts. Not real-world performance evidence.',
    method:
      'Ridge (alpha=1, trend and annual calendar features) versus trailing 3-month mean. Select using six rolling one-step validation errors. Refit on all history.',
    uncertainty:
      'Illustrative stress range, not a calibrated confidence interval or probability. Half-width = 2 * max(sum of selected one-step MAEs, 5% of recent mean income plus expenses) * sqrt(horizon). Balance bounds sum monthly bounds.',
    selectedAccounts: state.accounts,
    reserve: state.goal.reserve,
    expenseShock,
    target: plan.target,
    startingFund: plan.saved,
    validation: { income, expenses },
    history,
    forecast: rows,
  };
}
