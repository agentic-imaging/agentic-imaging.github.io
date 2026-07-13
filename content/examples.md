# Examples (pending)

Runnable examples accompany the docs, each with pinned environments and expected artifacts.
The first is a CPU-only deconvolution quickstart; the planned interface looks like this
(subject to change until release):

```bash
# planned interface — final flags land with the release
agx doctor --json                          # environment + GPU sanity check
agx run examples/quickstart_deconvolution  # replay a bundled run, no credentials
agx run examples/quickstart_deconvolution --live   # run the loop yourself
```

Examples deliberately include a *negative* case — a run where the verifier correctly blocks a
bad result — because seeing the system say "no" is the fastest way to understand what its "yes"
means.
