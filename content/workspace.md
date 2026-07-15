# The workspace, after a run

A finished run is where the real work starts. In AgX Studio the run opens as a workspace —
**Graph**, **Plan**, **Report**, and **Doc** views over the trace, with an **Agent** panel
beside them. From there you steer the run with plain-language prompts, add future steps, ask
questions about any step, and improve flagged results — until the run assembles a
publication-style report and document.

**Interactive demo** — every agent reply in the page's workspace panel is pre-scripted and
every number is an illustrative placeholder; the live Studio agent panel ships with the release.

Initial demo state (after the trace-demo run above it):

- Goals: G1 "Beat the Wiener baseline on val (+1 dB)" — met (demo); G2 "Residual ≤ 1.2×
  declared noise on every sample" — sample 3 flagged (demo); G3 "Publication-style report +
  doc" — pending (demo).
- Plan: steps 01 forward-model check, 02 Wiener baseline, 03 ADMM-TV tuned on val, 04
  test-split evaluation (1 sample flagged). Steps and graph nodes are clickable and set the
  Agent panel's context.
- Report: per-sample placeholder metrics; sample 3 residual 5.2×* → FLAGGED.
- Doc: locked until every goal is met.

The five scripted acts (run in order; chips for later acts stay disabled until reached):

1. **Steer** — "prioritize the high-noise regime": the controller re-weights the sweep toward
   σ-high cases; plan step 03 carries the steering note. Nothing already verified is discarded.
2. **Add a future step** — "λ sweep on validation": step 05 queues, runs, and lands (validation
   split only; test stays held out); a sweep node joins the graph; the report notes the frozen
   best λ.
3. **Ask about a step** — "why is sample 3 flagged?": the agent quotes the verifier record
   (residual 5.2×* the declared noise → physics-inconsistent), attributes it to a forward-model
   intensity-scaling mismatch, and suggests a corrected re-run. Selecting step 04 or the
   flagged row first makes the question step-specific.
4. **Improve** — "re-run sample 3 with corrected scaling": step 06 runs; the report row updates
   to 1.1×* → PASS; goal G2 flips to met.
5. **Assemble** — "publication-style report + doc": step 07 gathers record ids and emits the
   frozen report plus a compact publication-style document (title, byline, abstract, setup,
   method, results with a placeholder Fig. 1, verification & provenance, limitations). Every
   number remains an illustrative placeholder until the sealed evidence is revealed.

Without JavaScript the section renders its final state as stacked panels (the noscript note
says so); with JavaScript the panels become accessible tabs (arrow-key navigation) and the
scripted chat, suggested-action chips, prompt input, and "Reset demo" become active.
