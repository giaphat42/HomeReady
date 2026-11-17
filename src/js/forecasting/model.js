/** Small, inspectable machine-learning model. Fits coefficients from data in-browser.
 * Ridge objective: sum squared errors + alpha * sum squared non-intercept weights.
 * Fixed alpha=1; training-only standardisation; no network calls or stored model.
 */
const ALPHA = 1;
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);

export function monthIndex(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Use YYYY-MM calendar months.');
  const [year, number] = month.split('-').map(Number);
  return year * 12 + number - 1;
}
export function nextMonth(month, offset) {
  const value = monthIndex(month) + offset;
  return `${Math.floor(value / 12)}-${String((value % 12) + 1).padStart(2, '0')}`;
}
function features(month, origin) {
  const value = monthIndex(month);
  const calendar = value % 12;
  return [
    value - origin,
    Math.sin((2 * Math.PI * calendar) / 12),
    Math.cos((2 * Math.PI * calendar) / 12),
    calendar === 11 ? 1 : 0,
  ];
}
function solve(matrix, vector) {
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < vector.length; col++) {
    let pivot = col;
    for (let row = col + 1; row < a.length; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    [a[col], a[pivot]] = [a[pivot], a[col]];
    if (Math.abs(a[col][col]) < 1e-10) throw new Error('Training data cannot support this model.');
    const divisor = a[col][col];
    for (let j = col; j <= vector.length; j++) a[col][j] /= divisor;
    for (let row = 0; row < a.length; row++) {
      if (row === col) continue;
      const multiplier = a[row][col];
      for (let j = col; j <= vector.length; j++) a[row][j] -= multiplier * a[col][j];
    }
  }
  return a.map((row) => row.at(-1));
}

export function validateHistory(history) {
  if (!Array.isArray(history) || history.length < 30)
    throw new Error('At least 30 consecutive monthly records are required.');
  history.forEach((row, i) => {
    const month = monthIndex(row.month);
    if (i && month !== monthIndex(history[i - 1].month) + 1)
      throw new Error('History must contain consecutive months in chronological order.');
    if (
      !['income', 'expenses'].every(
        (key) => Number.isFinite(row[key]) && row[key] >= 0 && row[key] <= 10000000,
      )
    ) {
      throw new Error('Monthly amounts must be finite, non-negative numbers.');
    }
  });
}

export function fitRidge(history, field) {
  if (history.length < 24) throw new Error('Ridge training requires at least 24 months.');
  const origin = monthIndex(history[0].month);
  const raw = history.map((row) => features(row.month, origin));
  const means = raw[0].map((_, j) => mean(raw.map((row) => row[j])));
  const scales = means.map(
    (value, j) => Math.sqrt(mean(raw.map((row) => (row[j] - value) ** 2))) || 1,
  );
  const transform = (row) => [1, ...row.map((value, j) => (value - means[j]) / scales[j])];
  const x = raw.map(transform);
  const size = x[0].length;
  const matrix = Array.from({ length: size }, (_, i) =>
    Array.from(
      { length: size },
      (_, j) => x.reduce((sum, row) => sum + row[i] * row[j], 0) + (i === j && i !== 0 ? ALPHA : 0),
    ),
  );
  const vector = Array.from({ length: size }, (_, i) =>
    x.reduce((sum, row, j) => sum + row[i] * history[j][field], 0),
  );
  const coefficients = solve(matrix, vector);
  return {
    coefficients,
    predict: (month) => Math.max(0, dot(coefficients, transform(features(month, origin)))),
  };
}

/** Last six observations are rolling one-month validation targets.
 * Each fit only sees earlier months. Scores select the model, so they are validation
 * scores, not an independent final test or a six-month accuracy guarantee.
 */
export function compareModels(history, field) {
  validateHistory(history);
  const folds = [];
  for (let i = history.length - 6; i < history.length; i++) {
    const training = history.slice(0, i);
    const actual = history[i][field];
    folds.push({
      trainThrough: training.at(-1).month,
      month: history[i].month,
      actual,
      ridge: fitRidge(training, field).predict(history[i].month),
      baseline: mean(training.slice(-3).map((row) => row[field])),
    });
  }
  const ridgeMae = mean(folds.map((fold) => Math.abs(fold.actual - fold.ridge)));
  const baselineMae = mean(folds.map((fold) => Math.abs(fold.actual - fold.baseline)));
  const selected = ridgeMae < baselineMae - 0.01 ? 'ridge' : 'baseline';
  const fitted = fitRidge(history, field);
  const baseline = mean(history.slice(-3).map((row) => row[field]));
  return {
    ridgeMae,
    baselineMae,
    selected,
    folds,
    mae: selected === 'ridge' ? ridgeMae : baselineMae,
    predict: (month) => (selected === 'ridge' ? fitted.predict(month) : baseline),
  };
}

export function forecastCashFlow(history, { reserve = 0, saved = 0, expenseShock = 0 } = {}) {
  if (![reserve, saved, expenseShock].every((value) => Number.isFinite(value) && value >= 0))
    throw new Error('Scenario amounts must be finite and non-negative.');
  validateHistory(history);
  const income = compareModels(history, 'income');
  const expenses = compareModels(history, 'expenses');
  let balance = saved;
  let lowerBalance = saved;
  let upperBalance = saved;
  const rows = Array.from({ length: 6 }, (_, index) => {
    const month = nextMonth(history.at(-1).month, index + 1);
    const predictedIncome = income.predict(month);
    const predictedExpenses = expenses.predict(month) + expenseShock;
    const net = predictedIncome - predictedExpenses - reserve;
    // Deliberately a stress range, not a calibrated probability interval.
    const errorScale = Math.max(
      income.mae + expenses.mae,
      mean(history.slice(-3).map((row) => row.income + row.expenses)) * 0.05,
    );
    const spread = 2 * errorScale * Math.sqrt(index + 1);
    balance += net;
    lowerBalance += net - spread;
    upperBalance += net + spread;
    return {
      month,
      income: predictedIncome,
      expenses: predictedExpenses,
      net,
      lower: net - spread,
      upper: net + spread,
      balance,
      lowerBalance,
      upperBalance,
    };
  });
  return { income, expenses, rows, history, total: rows.reduce((sum, row) => sum + row.net, 0) };
}
