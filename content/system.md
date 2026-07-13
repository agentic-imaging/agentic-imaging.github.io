# The system

## Controller, agents, numeric workers

A lightweight controller orchestrates three kinds of components. **Planning and coding agents**
(multiple LLM providers in a roundtable, so no single model's blind spots dominate) draft
experiment plans, write solver code, and adversarially review each other's work before anything
executes. **Numeric workers** run the actual reconstructions — GPU jobs on local machines or a
cluster — and only ever exchange arrays and JSON with the agents. **Verifiers** sit between
results and reports.

## The verifier stack

Image-space metrics alone can never approve a result in AgX. Every reconstruction is checked
against the measurement it claims to explain: the relative measurement residual
`‖A(x̂) − y‖ / ‖y‖` must be consistent with the declared noise level.[^2] A *skeptical advisor*
watches every run and blocks reporting when artifacts are missing, hashes mismatch, or a result
looks too good to be true (which triggers a dedicated attack budget: metric recomputation, seed
fragility, forward-model mismatch, convention drift). Code changes pass a multi-agent
verification panel before execution.

## Provenance

Every reported number carries a record: raw arrays, per-sample metrics, code and config hashes,
compute environment, and the exact command that produced it. Records are immutable; downstream
figures and tables reference them by ID, and replay tooling can re-verify integrity (hash
checks), recompute metrics from frozen arrays, and re-run numerics under pinned tolerances.

What a provenance record contains:

- Frozen artifacts: reconstruction, ground truth (when defined), observation arrays.
- Per-sample metrics with the exact metric recipe (data range, clipping, SSIM window).
- Measurement residual against the declared noise model.
- Code state (commit, dirty-file hashes), configuration, random seeds.
- Compute capture: host, device, library versions, wall time.
- Append-only references: which figures and tables cite this record.

[^2]: Reconstructions whose residual exceeds a small multiple of the declared noise level are
flagged as physics-inconsistent regardless of how good their image-space metrics look.
