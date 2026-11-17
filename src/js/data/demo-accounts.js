/** Synthetic fixtures only. No bank APIs, credentials or customer records. */
export const DEMO_ACCOUNTS = [
  {
    id: 'everyday',
    bank: 'Westpac',
    name: 'Everyday account',
    number: '4821',
    balance: 8000,
    allocation: 50,
    mark: 'W',
  },
  {
    id: 'savings',
    bank: 'CommBank',
    name: 'Home savings',
    number: '1094',
    balance: 38500,
    allocation: 100,
    mark: 'C',
  },
  {
    id: 'side',
    bank: 'ANZ',
    name: 'Side-income account',
    number: '6208',
    balance: 5200,
    allocation: 100,
    mark: 'A',
  },
];

/** Three complete fictional statement months; transfer entries must not count as income. */
export function demoTransactions(snapshot = 0) {
  const months = snapshot ? ['2026-09', '2026-10', '2026-11'] : ['2026-08', '2026-09', '2026-10'];
  const transactions = [];
  const add = (account, month, category, amount, description) => {
    transactions.push({
      id: `${account}-${month}-${category}`,
      account,
      date: `${month}-15`,
      category,
      amount,
      description,
    });
  };
  months.forEach((month, index) => {
    add('everyday', month, 'income', 6200 + snapshot * 200, 'Salary · sample employer');
    add('everyday', month, 'rent', -1500, 'Monthly rent');
    add('everyday', month, 'utilities', -400, 'Utilities & internet');
    add('everyday', month, 'groceries', -850, 'Groceries & dining');
    add('everyday', month, 'transport', -400, 'Transport');
    add('everyday', month, 'travel', -300, 'Travel & experiences');
    add('everyday', month, 'other', -(250 + index * 100), 'Other everyday spending');
    add('everyday', month, 'transfer', -1800, 'Transfer to own savings');
    add('savings', month, 'transfer', 1800, 'Transfer from own everyday account');
    add('side', month, 'income', 400, 'Freelance income · sample');
    add('side', month, 'other', -100, 'Business expenses · sample');
  });
  return transactions;
}

export function accountBalance(id, snapshot = 0) {
  const account = DEMO_ACCOUNTS.find((item) => item.id === id);
  if (!account) return 0;
  return account.balance + (id === 'savings' ? snapshot * 1800 : 0);
}
