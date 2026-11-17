# Architecture and Development Guide

This document describes the HomeReady V2 code structure, data flow, financial model and extension points.

## Application startup

`src/index.html` loads the six CSS files in order (01–06), followed by the `src/js/main.js` ES module.

`main.js` retrieves state from `state/store.js`, calls `derivePlan(state)` and passes the resulting model to the feature modules in `features/`. User inputs update the shared state, and dependent views re-render from the same model. Financial calculations are not duplicated across individual pages.

## Single source of truth

1. **Fixtures:** `data/demo-accounts.js` supplies fictional account balances and three months of transactions.
2. **Aggregation:** `services/banking.js` filters selected accounts, excludes transfers between a customer's own accounts, calculates monthly averages and totals allocated balances using each account's allocation percentage.
3. **Model:** `calculators/finance.js` derives the monthly savings amount, target, timeline, repayment and post-purchase cash flow.
4. **State store:** `state/store.js` holds current state, persists it only with opt-in consent and notifies subscribers about changes.
5. **Views:** `features/*.js` renders derived outputs; these modules do not call external APIs.
6. **Event handlers:** `main.js` connects inputs and buttons to state updates.

## Extending the application

- **Add an input:** Define its default value and validation limits in `config.js`. Add an HTML control with `data-field="group.field"`. The generic binding in `main.js` handles eligible inputs.
- **Add a calculation:** Implement a pure function in `calculators/finance.js` and add independent tests in `tests/`.
- **Add a page:** Add an HTML section, register its page name in `main.js`, create a `data-page` navigation action and add a corresponding renderer in `features/`.
- **Update the theme:** Start with `styles/tokens.css` and avoid introducing hard-coded colour values in JavaScript.
- **Integrate a real AI provider:** Add a backend and server-side adapter. Document the transmitted data and obtain any additional consent required. Never expose an API key in client code.
- **Integrate real banking:** Replace the fixtures adapter with an appropriately authorised integration while preserving the aggregation contract. Before production, handle pending transactions, transfers, duplicates, joint accounts and incomplete transaction histories.

## Storage lifecycle

- **V2 key:** `homeready:v2`.
- The older V1 data is **not** automatically migrated because V2 has a different consent model.
- **Clear all data** also deletes the old `homeready-v1` key.
- Browser storage is specific to each origin: local development ports and a deployed site do not share `localStorage`.
- Chat messages are held only in memory. JSON export contains state and export time, but not credentials or chat history. Once downloaded, an exported file belongs to the user and cannot be deleted by the application's Clear action.

## Financial calculation rules

- **Savings target:** `property price × deposit percentage / 100 + purchase-cost buffer`.
- **Automatic monthly contribution:** `max(0, average monthly income − average monthly expenses − protected monthly buffer)`.
- **Months to goal:** `ceil(max(0, target − allocated savings) / monthly contribution)`; if the remaining target is positive and contribution is zero, the result is infinite.
- **Additional monthly savings:** `weekly contribution × 52 / 12`.
- **Target mortgage principal:** `property price − planned deposit`. This uses the future target deposit, not the user's entire current account balance.
- **Monthly repayment:** `P × r / (1 − (1 + r)^−n)` for monthly interest rate `r` and repayment count `n`; for `r = 0`, repayment is `P / n`.
- **Post-purchase remainder:** `income − non-rent expenses − ownership-cost buffer − estimated repayment`.

The model assumes contributions at the end of each month, while the chart displays an illustrative continuous path. The timeline uses the browser's current month. The chart is limited to a ten-year visual horizon for readability; the numeric timeline retains the full calculated duration.

## Development checks

Run `npm run check`, `npm test` and `npm run build` before publishing. `dist/` is generated output and should not be edited directly.

## Local forecasting pipeline (2.1)

`main.js` calls `features/forecast.js` alongside the other renderers. `forecasting/service.js` checks sample-data permission, Automatic mode and the presence of a cash-flow account before processing any monthly history.

`forecasting/history.js` generates 36 explicitly synthetic months. The last three reconcile with `demoTransactions()`; prior months are training fixtures only. `forecasting/model.js` fits a standardised Ridge model, runs chronological one-step validation, selects a model for each series and creates six forecasts. The feature renderer draws the chart, table, validation evidence and report export.

Forecast scenarios and fitted coefficients stay in memory, outside persisted state. Withdrawal and clearing reset the scenario and report. Hidden forecast tables are emptied when permission or data is unavailable. No forecast is written back into the deterministic home-plan timeline. The coach calls the same service for its base-forecast explanation.

See [FORECASTING.md](FORECASTING.md) for the complete model card.
