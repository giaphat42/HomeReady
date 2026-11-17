# HomeReady Forecasting Model Card

## Purpose and status

`homeready-ridge-1` forecasts monthly income and expenses, then derives six-month net cash available after a protected buffer. It is a working, browser-local supervised regression pipeline in HomeReady 2.1. Coefficients are fitted from the supplied history at runtime, not hard-coded predictions.

It does not predict RBA decisions, mortgage offers, property prices, creditworthiness or loan approval. Home Coach uses templates to explain its output and is not an LLM.

## Data provenance

The demo supplies 36 consecutive synthetic monthly observations for the selected accounts. Earlier 33 months are generated using invented trends, calendar effects and deterministic variation. The final three months match the existing fictional transaction snapshot exactly, excluding own-account transfers. No real customer or scraped market dataset is included.

This synthetic design makes the training pipeline demonstrable; performance on it is not evidence of performance on real people. The account simulator can advance the fictional period through November 2026 even before that real month has ended. Forecast dates follow the fictional statement period, not today's actual available records.

The engine requires at least 30 consecutive monthly observations, providing at least 24 training months before six validation targets. Short histories, gaps, duplicates and non-finite or negative monthly amounts are rejected. The demo does not import real banking records or upload data.

## Training and selection

For income and expenses independently:

1. Construct time-trend, annual sine, annual cosine and December-indicator features.
2. Standardise features using means and scales from the current training window only.
3. Fit Ridge regression by solving the regularised least-squares normal equations with pivoted elimination. Alpha is fixed at 1; the intercept is not penalised.
4. Produce six expanding-window one-step forecasts over the last six observed months. Every training window ends before its forecast target.
5. Compare each model's mean absolute error (MAE, in AUD) against the trailing three-month mean.
6. Select Ridge only if its validation MAE is lower by more than $0.01; otherwise select the baseline. Refit Ridge on all observed months for future predictions if selected.

The same validation observations select the method. Scores are therefore **model-selection validation**, not an independent final test. They measure one-month errors, not six-month accuracy. There is no hyperparameter search or hidden tuning against these scores.

Negative income or expense predictions are floored at zero, including in validation. Net cash is not floored: projected deficits must remain visible.

## Cash-flow output

For each future month:

`net cash = predicted income - predicted expenses - protected buffer - additional expense scenario`

`projected home fund = starting allocated home fund + cumulative net cash`

This assumes all net cash goes into the home fund and shortfalls draw it down. A negative fund denotes an unfunded gap, not credit availability. Balance allocations affect the starting fund; they do not scale income and expenses. The deterministic home-plan timeline remains separate and is never silently overwritten.

## Uncertainty and scenarios

The shaded range is a deliberately labelled **illustrative stress range**:

`scale = max(selected income MAE + selected expense MAE, 0.05 × recent mean(income + expenses))`

`monthly half-width = 2 × scale × sqrt(months ahead)`

The balance bounds sum the monthly bounds. This is conservative scenario arithmetic, not an estimated joint distribution. The range has no assigned probability, no measured coverage and must not be called a 95% confidence interval. Shocks or structural breaks can fall outside it.

Additional monthly expenses are a user-set scenario added after prediction. They do not retrain the model or change the existing Home Plan. Changing the protected buffer does affect both planning and forecast calculations.

## Privacy and lifecycle

Training, validation and inference run in the browser. No model endpoint, API key or network request is used. The model only processes selected sample accounts when sample-data permission is active and planning is Automatic. Savings-only transfers do not qualify as income history.

The expense scenario, fitted coefficients and report remain in memory and are never added to device storage. Withdrawal resets the scenario, removes report access and clears displayed forecast rows. Clearing all app data also resets the forecast. An exported report is a separate file under the user's control and is not deleted by clearing the app.

## Validation and reproducibility

Run:

```bash
npm run check
npm test
npm run build
```

Forecast tests check independent numerical equivalence to a NumPy linear-algebra reference, coefficient learning, chronological leakage prevention, baseline fallback, malformed history, account reconciliation, permission boundaries, negative net cash, budget arithmetic, date rollover and changes to the snapshot and buffer.

**Export model report** includes history, selected accounts, validation folds and scores, assumptions and forecast rows. Compare the recorded `modelVersion` when reviewing results.

## Short demo

1. Allow fictional sample data and open **AI Forecast** in Automatic mode.
2. Point to the income/expense model-selection table. A baseline fallback is an intentional quality check.
3. Show the six-month forecast, clearly labelled synthetic data and illustrative stress range.
4. Enter **500** in additional monthly expenses. Six-month net cash decreases by **3,000 AUD** without changing training history.
5. Change the protected buffer or simulate another account snapshot to demonstrate recalculation.
6. Withdraw sample-data permission and show that forecasting becomes unavailable.

Suggested explanation:

> HomeReady trains a small machine-learning model locally to forecast income and spending. We test it against a simple average using past-only validation and keep the better method for each series. The prototype uses synthetic data; it demonstrates the pipeline rather than claiming real-world accuracy.

## Method references

This is a small JavaScript implementation, not a dependency on scikit-learn. These primary documentation pages describe the underlying methods:

- [Ridge regression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.Ridge.html)
- [Time-series validation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html)
