# Trace viewer

Every AgX run produces a trace: the plan, each agent step, verifier decisions, and the
provenance trail. The release will ship an immutable trace viewer over sanitized public bundles.
The demo on the main page is a **self-contained illustrative demo** of that experience with
hard-coded local data — it makes no network requests and shows no real experimental results.

Demo steps (all demo data, no real results):

1. **Plan** (controller) — goal, split discipline (tune on validation, report on test), budget.
2. **Agents propose & review** (roundtable) — drafter writes solver config; reviewers catch a
   metric data-range bug before execution.
3. **Run** (numeric worker) — sweep on validation split, freeze best config, rerun on test;
   artifacts written with hashes (placeholder values in the demo).
4. **Verify** (verifier gate) — measurement residual vs. declared noise (placeholders);
   skeptical-advisor completeness/integrity checks.
5. **Provenance** (ledger) — immutable result record; figures/tables cite it by ID.
