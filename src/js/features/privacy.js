import { $, setText } from '../ui/helpers.js';
import { hasStorageProblem } from '../state/store.js';

export function renderPrivacy(state) {
  $('remember-setting').checked = state.permissions.remember;
  setText(
    'privacy-storage',
    hasStorageProblem()
      ? 'Browser storage unavailable — changes may not persist.'
      : state.permissions.remember
        ? 'Enabled. Plan and consent preferences are saved in this browser until you clear them.'
        : 'Disabled. This visit stays in memory; refreshing or closing the page discards changes.',
  );
  setText(
    'privacy-data',
    state.permissions.sampleData
      ? `Permission active for fictional account data. ${state.accounts.length} account(s) connected.`
      : 'No permission to use fictional bank data. Manual planning remains available.',
  );
  setText(
    'privacy-date',
    state.permissions.acknowledgedAt
      ? new Date(state.permissions.acknowledgedAt).toLocaleString('en-AU')
      : 'Not yet acknowledged',
  );
  setText('privacy-version', state.permissions.version);
  $('revoke-data').disabled = !state.permissions.sampleData;
  $('storage-warning').hidden = !hasStorageProblem();
}
