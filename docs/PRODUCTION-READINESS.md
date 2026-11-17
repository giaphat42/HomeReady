# Prototype Scope and Production Readiness

HomeReady V2 implements local data and privacy controls for a **fictional hackathon demonstration**. This does **not** establish that the app is suitable, authorised or compliant for collecting real banking customers' personal information. **Do not use genuine customer data to test it.**

## Privacy notice and consent

The current notice describes actual prototype behaviour: local processing, separate permission for sample accounts, optional browser persistence, JSON export and deletion of application state. It is not a credit agreement or a claim of regulatory accreditation.

Before releasing a real service, establish and publish the actual legal operator and contact/complaints channels, data categories and purposes, storage locations, retention periods, recipients, overseas disclosures, customer rights and incident-response processes. Any policies or notices must reflect actual data flows, receive appropriate legal and security review, and be maintained as the service changes. Adding a consent checkbox alone does not establish compliance.

Reference material consulted for the prototype on **17 November 2026**:

- [OAIC — Australian Privacy Principle 1: Open and transparent management of personal information](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-1-app-1-open-and-transparent-management-of-personal-information)
- [OAIC — Australian Privacy Principle 5: Notification of the collection of personal information](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-5-app-5-notification-of-the-collection-of-personal-information)
- [OAIC — Consent to the handling of personal information](https://www.oaic.gov.au/privacy/your-privacy-rights/your-personal-information/consent-to-the-handling-of-personal-information)

These links are references, not an assertion that the prototype satisfies the requirements they describe.

## Real banking connectivity

A production service would require an appropriate provider and customer authorisation process. Never ask for or store a customer's online banking password in the app. Access scopes, connection lifetime, revocation and retention must match the integration used. Server-side access control, secret management, encryption, auditing and deletion would need to be implemented and independently reviewed.

The account selection interface currently uses **fictional records only**; it is not a certified Consumer Data Right (CDR) consent flow.

## ASX rate expectations and mortgage pricing

Reference: [ASX RBA Rate Tracker](https://www.asx.com.au/markets/trade-our-derivatives-market/futures-market/rba-rate-tracker).

The ASX explains that the tracker derives probabilities of RBA cash-rate movements from ASX 30 Day Interbank Cash Rate Futures and updates its information at the end of the business day. No usable live numeric feed was integrated during development. Consequently, this prototype does **not** copy current market probabilities, scrape undocumented APIs or present invented percentages as live data.

For a future live integration, verify source access and licensing, implement a server-side adapter, display source and last-updated timestamps, handle stale or unavailable data, cache appropriately and provide attribution and fallbacks. Lender mortgage quotes are separate from futures-implied cash-rate expectations; the two must not be treated as equivalent.

Repayment reference: [Moneysmart Mortgage Calculator](https://moneysmart.gov.au/home-loans/mortgage-calculator).

## Local ML forecasting

Version 2.1 includes a working browser-local Ridge regression pipeline. This is distinct from the template-based Home Coach. The model uses 36 synthetic months and has not been validated on real customer cohorts. Synthetic validation scores do not establish real-world reliability.

Before using real records, establish authorised data access, transaction cleaning, missing-month handling, per-user data boundaries, enough historical coverage, and an independent chronological test set. Evaluate multi-step error, interval coverage, drift, bias across customer groups and the effect of major income or spending shocks. Add model monitoring and human escalation. Do not use this prototype for automated lending decisions.

See [the model card](FORECASTING.md). The current stress range is a heuristic and must not be described as a calibrated confidence interval.

## AI and financial safety

The current Home Coach is a **rule-based demonstration** and makes no external AI requests. A future LLM integration would require a clear disclosure of the provider and data transmitted, a verified retention configuration, and consent appropriate to actual data processing. API keys must remain on the server.

Financial numbers should continue to come from independently testable calculator functions rather than trusting a generative model to produce arithmetic or repayment estimates. User-facing outputs should clearly separate illustrations from personalised financial advice.

## Deployment checklist

Before deploying a real customer-facing version, address secure authentication and authorisation, privacy-policy ownership, backend security, data handling, accessibility, error monitoring, third-party dependencies, operational support, audit logs, legal review and independent security testing. The existing local prototype does not implement these production controls.
