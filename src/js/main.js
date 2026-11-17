/**
 * APPLICATION ENTRY POINT
 * 1. Load state -> 2. Derive financial model -> 3. Render screens -> 4. Bind interactions.
 * Business calculations live in calculators/finance.js, not in UI event handlers.
 */
import { LIMITS, REFERENCES, PRIVACY_VERSION } from './config.js';
import { DEMO_ACCOUNTS } from './data/demo-accounts.js';
import { derivePlan } from './calculators/finance.js';
import { getState, updateState, setField, subscribe, clearAllData } from './state/store.js';
import { $, setText, toast, downloadJson } from './ui/helpers.js';
import { renderIcons } from './ui/icons.js';
import { renderDashboard } from './features/dashboard.js';
import { renderPlan } from './features/plan.js';
import { renderRates } from './features/rates.js';
import { renderAccounts, renderBankChoices } from './features/accounts.js';
import { renderCoach, coachReply, addMessage, resetChat } from './features/coach.js';
import { renderPrivacy } from './features/privacy.js';
import { renderForecast, bindForecast, resetForecast } from './features/forecast.js';

const pages = {
  overview: 'Overview',
  plan: 'My home plan',
  rates: 'Rate Lab',
  forecast: 'AI Forecast',
  accounts: 'Connected accounts',
  coach: 'Home coach',
  privacy: 'Privacy & control',
};

function navigate(page) {
  if (!pages[page]) page = 'overview';
  document.querySelectorAll('.page').forEach((element) => {
    element.hidden = element.id !== page;
  });
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === page);
    if (button.dataset.page === page) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  setText('breadcrumb', pages[page]);
  history.replaceState(null, '', `#${page}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncInputs(state) {
  document.querySelectorAll('[data-field]').forEach((input) => {
    const [group, field] = input.dataset.field.split('.');
    if (input !== document.activeElement) input.value = state[group][field];
  });
}

function render(state = getState()) {
  const plan = derivePlan(state);
  syncInputs(state);
  renderDashboard(state, plan);
  renderPlan(state, plan);
  renderRates(state, plan);
  renderAccounts(state, plan);
  renderCoach(state, plan);
  renderPrivacy(state);
  renderForecast(state, plan);
}

function openWelcome() {
  $('welcome-sample').checked = false;
  $('welcome-remember').checked = false;
  $('start-sample').disabled = true;
  $('app-shell').inert = true;
  $('welcome-dialog').showModal();
}

function startWorkspace(useSample) {
  const remember = $('welcome-remember').checked;
  updateState((state) => {
    state.onboarding = true;
    state.permissions = {
      remember,
      sampleData: useSample,
      acknowledgedAt: new Date().toISOString(),
      version: PRIVACY_VERSION,
    };
    state.mode = useSample ? 'automatic' : 'manual';
    state.accounts = useSample
      ? DEMO_ACCOUNTS.slice(0, 2).map((account) => ({
          id: account.id,
          allocation: account.allocation,
        }))
      : [];
  });
  $('welcome-dialog').close();
  $('app-shell').inert = false;
  navigate(useSample ? 'overview' : 'plan');
  toast(
    remember
      ? 'Your workspace will be remembered on this device.'
      : 'Session-only mode. Nothing is saved across visits.',
  );
}

// Navigation and public reference links.
document.querySelectorAll('[data-page], [data-nav]').forEach((button) => {
  button.addEventListener('click', () => navigate(button.dataset.page || button.dataset.nav));
});
document.querySelectorAll('[data-reference]').forEach((link) => {
  link.href = REFERENCES[link.dataset.reference];
});

// Reactive inputs: recalculate immediately, without a separate Save button.
document.querySelectorAll('[data-field]').forEach((input) => {
  const bounds = LIMITS[input.dataset.field];
  if (bounds) {
    input.min = bounds[0];
    input.max = bounds[1];
  }
  input.addEventListener('input', () => {
    if (input.type === 'number' || input.type === 'range') {
      if (input.value === '' || !input.checkValidity()) {
        $('input-warning').hidden = false;
        return;
      }
      setField(input.dataset.field, Number(input.value));
    } else {
      if (!input.value.trim()) {
        $('input-warning').hidden = false;
        return;
      }
      setField(input.dataset.field, input.value.slice(0, 70));
    }
    $('input-warning').hidden =
      Boolean(document.querySelector('input[data-field]:invalid')) === false;
  });
});

document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    const current = derivePlan(getState());
    updateState((state) => {
      if (mode === 'manual' && state.mode !== 'manual') {
        state.manual = {
          income: current.income,
          expenses: current.expenses,
          rent: current.rent,
          saved: current.saved,
          monthly: current.monthly,
        };
      }
      state.mode = mode;
    });
    toast(
      mode === 'automatic'
        ? 'Your plan now follows the connected sample accounts.'
        : 'Current figures copied into editable manual inputs.',
    );
  });
});

$('apply-extra').addEventListener('click', () => {
  const plan = derivePlan(getState());
  if (plan.extra > plan.surplus || plan.remaining === 0) return;
  updateState((state) => {
    if (state.mode === 'automatic')
      state.goal.reserve = Math.max(0, Math.round((state.goal.reserve - plan.extra) * 100) / 100);
    else state.manual.monthly = Math.round((state.manual.monthly + plan.extra) * 100) / 100;
    state.scenario.weekly = 0;
  });
  toast('Scenario applied. Your plan and timeline have updated.');
});

// Fictional bank consent is separate from optional device storage.
function openConnections() {
  renderBankChoices(getState());
  $('bank-consent').checked = false;
  $('connect-error').textContent = '';
  $('connection-dialog').showModal();
}
document
  .querySelectorAll('[data-connect]')
  .forEach((button) => button.addEventListener('click', openConnections));
$('connection-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const selected = [...document.querySelectorAll('input[name="bank"]:checked')].map(
    (input) => input.value,
  );
  if (!selected.length) {
    setText('connect-error', 'Choose at least one sample account.');
    return;
  }
  if (!$('bank-consent').checked) {
    setText(
      'connect-error',
      'Allow use of the selected fictional balances and transactions to continue.',
    );
    return;
  }
  updateState((state) => {
    state.permissions.sampleData = true;
    for (const id of selected) {
      const sample = DEMO_ACCOUNTS.find((account) => account.id === id);
      if (!state.accounts.some((account) => account.id === id))
        state.accounts.push({ id, allocation: sample.allocation });
    }
  });
  $('connection-dialog').close();
  toast(
    getState().mode === 'automatic'
      ? 'Sample accounts connected. Your entire plan has recalculated.'
      : 'Accounts connected. Switch to Automatic in My home plan to use their figures.',
  );
});
$('accounts-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-disconnect]');
  if (!button) return;
  updateState((state) => {
    state.accounts = state.accounts.filter((account) => account.id !== button.dataset.disconnect);
  });
  toast('Sample account disconnected and removed from automatic calculations.');
});
$('accounts-list').addEventListener('input', (event) => {
  const input = event.target.closest('[data-allocation]');
  if (!input || input.value === '' || !input.checkValidity()) return;
  updateState((state) => {
    state.accounts.find((account) => account.id === input.dataset.allocation).allocation = Number(
      input.value,
    );
  });
});
$('simulate-snapshot').addEventListener('click', () => {
  updateState((state) => {
    state.snapshot = state.snapshot ? 0 : 1;
  });
  toast('Fictional statement snapshot changed. Account totals, cash flow and plans recalculated.');
});

// Privacy choices are not bundled with each other or with a contractual agreement.
$('welcome-sample').addEventListener('change', () => {
  $('start-sample').disabled = !$('welcome-sample').checked;
});
$('start-sample').addEventListener('click', () => startWorkspace(true));
$('start-manual').addEventListener('click', () => startWorkspace(false));
$('welcome-dialog').addEventListener('cancel', (event) => event.preventDefault());
$('remember-setting').addEventListener('change', (event) => {
  updateState((state) => {
    state.permissions.remember = event.target.checked;
  });
  toast(
    event.target.checked
      ? 'Device storage enabled for this workspace.'
      : 'Stored workspace removed. Current work stays in memory for this visit.',
  );
});
$('revoke-data').addEventListener('click', () => {
  resetForecast();
  updateState((state) => {
    state.permissions.sampleData = false;
    state.accounts = [];
  });
  toast('Sample-data permission withdrawn. Connected data removed from calculations.');
});
$('export-data').addEventListener('click', () =>
  downloadJson(
    {
      exportedAt: new Date().toISOString(),
      notice: 'HomeReady prototype; fictional and manually entered planning data.',
      state: getState(),
    },
    'HomeReady-plan.json',
  ),
);
$('delete-data').addEventListener('click', () => $('delete-dialog').showModal());
$('confirm-delete').addEventListener('click', () => {
  $('delete-dialog').close();
  resetForecast();
  clearAllData();
  resetChat();
  navigate('overview');
  openWelcome();
});

// Named close buttons keep dialog behaviour explicit and keyboard-accessible.
document
  .querySelectorAll('[data-close]')
  .forEach((button) => button.addEventListener('click', () => $(button.dataset.close).close()));
document
  .querySelectorAll('[data-notice]')
  .forEach((button) => button.addEventListener('click', () => $('notice-dialog').showModal()));

// Guided coach; conversations stay in memory and are never sent to an AI endpoint.
function ask(question) {
  navigate('coach');
  addMessage(question, 'user');
  addMessage(coachReply(question), 'assistant');
}
document
  .querySelectorAll('[data-question]')
  .forEach((button) => button.addEventListener('click', () => ask(button.dataset.question)));
$('chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const question = $('chat-input').value.trim();
  if (!question) return;
  $('chat-input').value = '';
  ask(question);
});

bindForecast(() => render());
renderIcons();
resetChat();
subscribe(render);
render();
navigate(location.hash.slice(1));
if (!getState().onboarding) openWelcome();
