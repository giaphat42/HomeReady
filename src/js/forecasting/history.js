import { demoTransactions } from '../data/demo-accounts.js';

/** Expanded synthetic training fixture, never real customer history.
 * Last three months exactly match the existing account snapshot.
 * Earlier months contain invented trend, seasonal spending and deterministic noise.
 */
export function forecastHistory(accounts, snapshot = 0) {
  const selected = new Set(accounts.map((account) => account.id));
  const recent = demoTransactions(snapshot);
  const end = snapshot ? 10 : 9;
  return Array.from({ length: 36 }, (_, index) => {
    const date = new Date(Date.UTC(2026, end - 35 + index, 1));
    const month = date.toISOString().slice(0, 7);
    const calendar = date.getUTCMonth();
    let income = 0;
    let expenses = 0;
    if (index >= 33) {
      for (const row of recent) {
        if (
          !selected.has(row.account) ||
          row.category === 'transfer' ||
          !row.date.startsWith(month)
        )
          continue;
        if (row.amount > 0) income += row.amount;
        else expenses -= row.amount;
      }
    } else {
      if (selected.has('everyday')) {
        income += 5400 + index * 24 + 55 * Math.sin(index * 2.1);
        expenses +=
          3100 +
          index * 18 +
          130 * Math.sin((2 * Math.PI * calendar) / 12) +
          (calendar === 11 ? 650 : 0) +
          80 * Math.cos(index * 1.7);
      }
      if (selected.has('side')) {
        income += 320 + index * 2.4 + 25 * Math.sin(index * 1.3);
        expenses += 85 + index * 0.45 + 8 * Math.cos(index * 0.8);
      }
    }
    return {
      month,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
    };
  });
}
