import { DEMO_ACCOUNTS, accountBalance } from '../data/demo-accounts.js';
import { $, escapeHtml, money, setText } from '../ui/helpers.js';

let previousSignature = '';

function accountCard(account, snapshot) {
  const fixture = DEMO_ACCOUNTS.find((item) => item.id === account.id);
  return `
    <article class="account-card">
      <div class="account-heading">
        <span class="bank-mark">${fixture.mark}</span>
        <span class="badge">SIMULATED</span>
      </div>
      <h3>${fixture.bank}</h3>
      <p>${fixture.name} · ${fixture.number}</p>
      <div class="account-balance">${money(accountBalance(account.id, snapshot))}</div>
      <label>
        Allocate to my home fund (%)
        <input type="number" min="0" max="100" step="1"
          value="${account.allocation}" data-allocation="${account.id}"
          aria-label="${fixture.bank} home fund allocation percentage">
      </label>
      <div class="account-foot">
        <span>Balance + transactions</span>
        <button class="text-button" data-disconnect="${account.id}">Disconnect</button>
      </div>
    </article>
  `;
}

function transactionRow(row) {
  const sign = row.amount > 0 ? '+' : '−';
  return `
    <tr>
      <td>${row.date}</td>
      <td>${escapeHtml(row.description)}</td>
      <td><span class="category-label">${row.category}</span></td>
      <td class="${row.amount > 0 ? 'positive' : ''}">${sign}${money(Math.abs(row.amount))}</td>
    </tr>
  `;
}

export function renderAccounts(state, plan) {
  // Preserve the focused allocation input during reactive recalculation.
  const signature = JSON.stringify([state.accounts.map((account) => account.id), state.snapshot]);
  if (signature !== previousSignature) {
    previousSignature = signature;
    $('accounts-list').innerHTML =
      state.accounts.map((account) => accountCard(account, state.snapshot)).join('') ||
      `
      <div class="empty-state">
        <h3>Your accounts stay your choice.</h3>
        <p>Connect a fictional account to try automatic planning. You can also use manual inputs.</p>
      </div>
    `;
  }
  for (const account of state.accounts) {
    const input = document.querySelector(`[data-allocation="${account.id}"]`);
    if (input && input !== document.activeElement) input.value = account.allocation;
  }
  setText('accounts-total', money(plan.bank.balance));
  setText('accounts-allocated', money(plan.bank.saved));
  setText(
    'statement-period',
    state.snapshot
      ? 'September–November 2026 · fictional snapshot 2'
      : 'August–October 2026 · fictional snapshot 1',
  );
  $('simulate-snapshot').disabled = !state.accounts.length;
  setText(
    'snapshot-action',
    state.snapshot ? 'Restore sample snapshot' : 'Simulate a new snapshot',
  );
  const rows = plan.bank.transactions
    .filter((row) => row.category !== 'transfer')
    .slice(-10)
    .reverse();
  $('transactions-body').innerHTML =
    rows.map(transactionRow).join('') ||
    `
    <tr><td colspan="4">Connect sample accounts to see their fictional transactions.</td></tr>
  `;
}

export function renderBankChoices(state) {
  $('bank-choices').innerHTML = DEMO_ACCOUNTS.map((account) => {
    const connected = state.accounts.some((item) => item.id === account.id);
    return `
      <label class="bank-choice ${connected ? 'disabled' : ''}">
        <input type="checkbox" name="bank" value="${account.id}" ${connected ? 'disabled' : ''}>
        <span class="bank-mark">${account.mark}</span>
        <span>
          <strong>${account.bank}</strong>
          <small>${account.name} · ${money(accountBalance(account.id, state.snapshot))}</small>
        </span>
        <span class="choice-status">${connected ? 'Connected' : 'Sample'}</span>
      </label>
    `;
  }).join('');
}
