import { accountBalance, demoTransactions } from '../data/demo-accounts.js';

/** Aggregate one three-month snapshot. Own-account transfers are explicitly excluded. */
export function aggregateAccounts(accounts, snapshot = 0) {
  const selected = new Set(accounts.map((account) => account.id));
  const transactions = demoTransactions(snapshot).filter((row) => selected.has(row.account));
  const categories = {};
  let income = 0;
  let expenses = 0;
  let rent = 0;

  for (const row of transactions) {
    if (row.category === 'transfer') continue;
    if (row.amount > 0) income += row.amount;
    if (row.amount < 0) {
      const amount = -row.amount;
      expenses += amount;
      categories[row.category] = (categories[row.category] || 0) + amount / 3;
      if (row.category === 'rent') rent += amount;
    }
  }

  const balance = accounts.reduce((sum, account) => sum + accountBalance(account.id, snapshot), 0);
  const saved = accounts.reduce(
    (sum, account) => sum + (accountBalance(account.id, snapshot) * account.allocation) / 100,
    0,
  );
  return {
    income: income / 3,
    expenses: expenses / 3,
    rent: rent / 3,
    balance,
    saved,
    categories,
    transactions,
  };
}
