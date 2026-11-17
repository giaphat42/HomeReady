import { DEFAULT_STATE, LIMITS, PRIVACY_VERSION, STORAGE_KEY } from '../config.js';
import { DEMO_ACCOUNTS } from '../data/demo-accounts.js';

const cloneDefaults = () => structuredClone(DEFAULT_STATE);
const listeners = new Set();
let storageProblem = false;

/** Never trust stored input. Copy recognised fields only and enforce current limits. */
export function sanitiseState(candidate) {
  const result = cloneDefaults();
  if (
    !candidate ||
    candidate.version !== 2 ||
    candidate.permissions?.remember !== true ||
    candidate.permissions?.version !== PRIVACY_VERSION
  )
    return result;

  for (const [path, [min, max]] of Object.entries(LIMITS)) {
    const [group, field] = path.split('.');
    const value = candidate[group]?.[field];
    if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max)
      result[group][field] = value;
  }
  if (typeof candidate.goal?.location === 'string')
    result.goal.location = candidate.goal.location.slice(0, 70);
  result.mode = candidate.mode === 'manual' ? 'manual' : 'automatic';
  result.snapshot = candidate.snapshot === 1 ? 1 : 0;
  result.onboarding = candidate.onboarding === true;
  result.permissions = {
    remember: true,
    sampleData: candidate.permissions.sampleData === true,
    acknowledgedAt:
      typeof candidate.permissions.acknowledgedAt === 'string'
        ? candidate.permissions.acknowledgedAt
        : null,
    version: PRIVACY_VERSION,
  };
  if (result.permissions.sampleData && Array.isArray(candidate.accounts)) {
    const seen = new Set();
    result.accounts = candidate.accounts
      .filter((account) => {
        if (!account || typeof account !== 'object') return false;
        if (!DEMO_ACCOUNTS.some((item) => item.id === account.id) || seen.has(account.id))
          return false;
        if (
          !Number.isFinite(account.allocation) ||
          account.allocation < 0 ||
          account.allocation > 100
        )
          return false;
        seen.add(account.id);
        return true;
      })
      .map((account) => ({ id: account.id, allocation: account.allocation }));
  }
  return result;
}

function readStorage() {
  try {
    return sanitiseState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return cloneDefaults();
  }
}

let state = readStorage();
export const getState = () => state;
export const hasStorageProblem = () => storageProblem;

function persist() {
  try {
    if (state.permissions.remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
    storageProblem = false;
  } catch {
    storageProblem = true;
  }
}

export function updateState(change) {
  change(state);
  persist();
  for (const listener of listeners) listener(state);
}

export function setField(path, value) {
  const [group, field] = path.split('.');
  updateState((current) => {
    current[group][field] = value;
  });
}

export function subscribe(listener) {
  listeners.add(listener);
}

export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('homeready-v1'); // Clear the previous prototype's data too.
  } catch {
    storageProblem = true;
  }
  state = cloneDefaults();
  for (const listener of listeners) listener(state);
}
