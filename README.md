# AgX public site (`public/agx-site/`)

Self-contained static website for the AgX public release. No build step, no dependencies,
no external requests: plain HTML + CSS + vanilla JS with system fonts only.

## Preview locally

```bash
cd public/agx-site
python3 -m http.server 8080
# open http://localhost:8080/
```

Opening `index.html` directly from `file://` also works (the sample-evidence table then renders
from an inline mirror instead of fetching `content/evidence.sample.json`).

## Structure

```
index.html              main long-form page (hero, system, evidence, report, docs, examples, trace demo)
license.html            license status (pending release policy lock)
privacy.html            privacy statement (no analytics / cookies / external requests)
accessibility.html      WCAG 2.2 AA statement + known limitations
404.html                not-found page (used by GitHub Pages)
favicon.svg             site icon
.nojekyll               tells GitHub Pages to serve files as-is
assets/css/site.css     the whole design system (light/dark via CSS custom properties)
assets/js/site.js       progressive enhancement only (theme, scroll-spy, copy, drawer, sample table)
content/*.md            editable Markdown sources mirroring each page section
content/evidence.sample.json  placeholder evidence rows (all values are explicit XX.X samples)
SITE_NOTES.md           design decisions, honesty rules, divergence notes
```

The HTML is the canonical rendering; the Markdown files under `content/` are the editable prose
sources. If you edit one, mirror the change in the other (and keep the inline
`#evidence-fallback` JSON in `index.html` in sync with `content/evidence.sample.json`).

## Deploying to GitHub Pages (instructions only — do not deploy without release approval)

Publishing this site is part of the human-gated release transaction (roadmap Q05). When a human
release owner approves:

1. Push this directory's contents to the branch GitHub Pages serves, e.g. keep the repo's
   Pages configuration pointed at a `gh-pages` branch (or `docs/` folder) and copy
   `public/agx-site/` there, preserving `.nojekyll`.
2. In the repository settings, enable **Pages → Deploy from branch**, select the branch/folder.
3. Verify the served site: every route loads, the browser network tab shows **zero external
   requests**, and `404.html` handles bad URLs.

No DNS, analytics, or CDN configuration is required — the site is designed to work as plain
static files.

## Content honesty rules

- No real evidence numbers may appear anywhere on this site until the sealed evidence protocol
  completes (custodian-authorized reveal) and a human release gate approves the claims.
  Placeholders must remain visibly placeholders (`XX.X`, "sample", banner).
- Do not embed protected manuscript figures; diagrams here are original to this site.
