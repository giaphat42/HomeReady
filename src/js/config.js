/** App-wide configuration. Start here to change defaults, limits or reference links. */
export const STORAGE_KEY = 'homeready:v2';
export const PRIVACY_VERSION = '2026-11-17.v2';
export const REFERENCES = {
  asx: 'https://www.asx.com.au/markets/trade-our-derivatives-market/futures-market/rba-rate-tracker',
  mortgage: 'https://moneysmart.gov.au/home-loans/mortgage-calculator',
  privacy:
    'https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/what-is-a-privacy-policy',
};

export const DEFAULT_STATE = {
  version: 2,
  onboarding: false,
  mode: 'automatic',
  goal: { location: 'Gold Coast, QLD', price: 650000, deposit: 20, costs: 15000, reserve: 600 },
  manual: { income: 0, expenses: 0, rent: 0, saved: 0, monthly: 0 },
  mortgage: { rate: 6.25, years: 30, ownership: 350, change: -0.25, passThrough: 100 },
  scenario: { weekly: 100 },
  accounts: [],
  snapshot: 0,
  permissions: {
    remember: false,
    sampleData: false,
    acknowledgedAt: null,
    version: PRIVACY_VERSION,
  },
};

/** Numeric bounds are shared by HTML forms and stored-state validation. */
export const LIMITS = {
  'goal.price': [50000, 10000000],
  'goal.deposit': [1, 100],
  'goal.costs': [0, 1000000],
  'goal.reserve': [0, 100000],
  'manual.income': [0, 1000000],
  'manual.expenses': [0, 1000000],
  'manual.rent': [0, 1000000],
  'manual.saved': [0, 10000000],
  'manual.monthly': [0, 100000],
  'mortgage.rate': [0, 20],
  'mortgage.years': [1, 40],
  'mortgage.ownership': [0, 100000],
  'mortgage.change': [-2, 3],
  'mortgage.passThrough': [0, 100],
  'scenario.weekly': [0, 300],
};
