# AgX — Agentic Scientific Imaging

> A system of language-model agents that plans, implements, runs, verifies, and documents
> computational-imaging experiments end to end — with the skepticism built in.

The AgX team · author list and affiliations to be finalized at public release · 2026

Links: [See the workspace demo](#workspace) · [Trace demo](#trace) · Technical report (pending) · Code (pending)

## Overview

Computational imaging turns raw sensor measurements into images by solving inverse problems:
deblurring a microscope, unrolling a lensless camera, reconstructing a black-hole image from
interferometric visibilities. Getting a *trustworthy* reconstruction requires far more than
calling a solver — forward models must be checked, hyperparameters tuned on the right split,
metrics computed consistently, and every claim traced back to raw arrays.

**AgX** is an agentic system that runs this whole loop. Language-model agents plan an
experiment, write and review the code, launch it on local or cluster compute, and then —
the part we care most about — *verify* the result against the physics and record complete
provenance before any number is allowed to be reported.

*Figure 1: the AgX loop — measurement → (plan → implement → run → verify) → reconstruction,
with a provenance ledger recording every step.*

AgX operates in two modes.

- **Deployment**: given a new imaging problem — a forward model, data, and a goal — the system
  adapts known solvers, tunes them honestly on validation data, and delivers verified
  reconstructions on held-out test data.
- **Discovery**: the system proposes candidate reconstruction-algorithm variants, implements
  and benchmarks them under matched budgets, and reports which survive skeptical review.[^1]

> A core AgX rule: **frozen ≠ publishable**. An artifact can be sealed, hashed, and
> reproducible and still not be approved as a public claim until its evidence gate passes.

[^1]: Discovery-mode results are reported under matched compute budgets against tuned classical
and learned baselines; proposals that do not beat their baselines are reported as such.
