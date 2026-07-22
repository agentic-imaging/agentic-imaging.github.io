/* AgX public site — progressive enhancement only. No network calls except a
   same-origin fetch of local sample content (with an inline fallback so the
   page also works from file://). No analytics, no cookies, no third parties. */
(function () {
  "use strict";

  /* ---------- theme toggle (localStorage only; no cookies) ---------- */
  var THEME_KEY = "agx-theme";
  var root = document.documentElement;

  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t);
    else root.removeAttribute("data-theme");
  }
  applyTheme(storedTheme());

  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var current = root.getAttribute("data-theme") || (systemDark ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      themeBtn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    });
  }

  /* ---------- top bar: transparent at the very top, glass once scrolled ---------- */
  function syncTopbar() {
    var y = window.scrollY || window.pageYOffset || 0;
    root.classList.toggle("attop", y <= 4);
  }
  syncTopbar();
  window.addEventListener("scroll", syncTopbar, { passive: true });
  window.addEventListener("resize", syncTopbar, { passive: true });
  window.addEventListener("load", syncTopbar);

  /* ---------- dynamic hero glow: the warm gradient eases toward the cursor ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    var gx = 50, gy = -12, tgx = 50, tgy = -12, graf = null;
    function glowTick() {
      gx += (tgx - gx) * 0.09; gy += (tgy - gy) * 0.09;
      root.style.setProperty("--gx", gx.toFixed(1) + "%");
      root.style.setProperty("--gy", gy.toFixed(1) + "%");
      graf = (Math.abs(tgx - gx) > 0.1 || Math.abs(tgy - gy) > 0.1) ? requestAnimationFrame(glowTick) : null;
    }
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      tgx = (e.clientX / window.innerWidth) * 100;
      tgy = (e.clientY / window.innerHeight) * 100;
      if (!graf) graf = requestAnimationFrame(glowTick);
    }, { passive: true });
  }

  /* ---------- audio narration: toggle + live one-line caption ---------- */
  var audioBtn = document.getElementById("audio-toggle");
  var caption = document.getElementById("narration-caption");
  if (audioBtn && caption) {
    var capText = document.getElementById("narration-caption-text") || caption;
    var capClose = document.getElementById("narration-caption-close");
    var narr = null, cues = null, ci = -1, capTimer = null;
    function armAuto() { clearTimeout(capTimer); capTimer = setTimeout(hideCap, 60000); }  // auto-close ~1 min after narration stops updating
    function hideCap() { clearTimeout(capTimer); if (narr && !narr.paused) { narr.pause(); setState(false); } caption.hidden = true; ci = -1; }
    if (capClose) capClose.addEventListener("click", function () { hideCap(); if (audioBtn) audioBtn.focus(); });  // return focus on manual close (a11y)
    function setState(playing) {
      audioBtn.classList.toggle("playing", playing);
      audioBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      audioBtn.setAttribute("aria-label", playing ? "Pause audio narration" : "Play audio narration");
    }
    function onTime() {
      if (!cues || !cues.length) return;
      var t = narr.currentTime, i = ci;
      while (i + 1 < cues.length && cues[i + 1].t <= t) i++;
      while (i >= 0 && cues[i].t > t) i--;
      if (i !== ci && i >= 0) {
        ci = i; capText.textContent = cues[i].s; armAuto();
        caption.classList.remove("show"); void caption.offsetWidth; caption.classList.add("show");
      }
    }
    audioBtn.addEventListener("click", function () {
      if (!narr) {
        narr = new Audio(audioBtn.getAttribute("data-audio"));
        narr.addEventListener("timeupdate", onTime);
        narr.addEventListener("ended", function () { setState(false); caption.hidden = true; ci = -1; });
        fetch(audioBtn.getAttribute("data-cues")).then(function (r) { return r.json(); })
          .then(function (c) { cues = c; }).catch(function () { cues = []; });
      }
      if (narr.paused) { narr.play(); setState(true); caption.hidden = false; armAuto(); }
      else { narr.pause(); setState(false); }
    });
  }

  /* ---------- mobile TOC drawer ---------- */
  var tocBtn = document.getElementById("toc-toggle");
  var toc = document.getElementById("toc");
  if (tocBtn && toc) {
    tocBtn.addEventListener("click", function () {
      var open = toc.classList.toggle("open");
      tocBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    toc.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) {
        toc.classList.remove("open");
        tocBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && toc.classList.contains("open")) {
        toc.classList.remove("open");
        tocBtn.setAttribute("aria-expanded", "false");
        tocBtn.focus();
      }
    });
  }

  /* ---------- TOC scroll-spy ---------- */
  var tocLinks = toc ? Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]')) : [];
  var targets = tocLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if (targets.length && "IntersectionObserver" in window) {
    var activeId = null;
    var setActive = function (id) {
      if (id === activeId) return;
      activeId = id;
      tocLinks.forEach(function (a) {
        if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) visible.add(en.target.id);
        else visible.delete(en.target.id);
      });
      for (var i = 0; i < targets.length; i++) {
        if (visible.has(targets[i].id)) { setActive(targets[i].id); return; }
      }
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- copy buttons on code blocks ---------- */
  document.querySelectorAll(".codeblock").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", function () {
      var text = pre.innerText;
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
    block.appendChild(btn);
  });

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* best effort */ }
    document.body.removeChild(ta);
    done();
  }

  /* ---------- trace demo: expand / collapse all ---------- */
  var tracePanel = document.getElementById("trace-demo");
  if (tracePanel) {
    var setAll = function (open) {
      tracePanel.querySelectorAll("details.trace-step").forEach(function (d) { d.open = open; });
    };
    var ex = document.getElementById("trace-expand");
    var co = document.getElementById("trace-collapse");
    if (ex) ex.addEventListener("click", function () { setAll(true); });
    if (co) co.addEventListener("click", function () { setAll(false); });
  }

  /* ---------- evidence sample table ----------
     Canonical editable source: content/evidence.sample.json (same-origin).
     An identical inline mirror (#evidence-fallback) keeps file:// preview
     working. Values are explicit placeholders ("XX.X") by design: no real
     evidence number exists on this site until the sealed E10 reveal. */
  var evTable = document.getElementById("evidence-tbody");
  if (evTable) {
    var render = function (rows) {
      evTable.textContent = "";
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        [r.case_study, r.modality, r.metric, r.value, r.evidence_id].forEach(function (cell, i) {
          var td = document.createElement("td");
          if (i === 4) {
            var chip = document.createElement("span");
            chip.className = "chip";
            chip.textContent = cell;
            td.appendChild(chip);
          } else {
            td.textContent = cell;
          }
          tr.appendChild(td);
        });
        evTable.appendChild(tr);
      });
    };
    var fallback = function () {
      var el = document.getElementById("evidence-fallback");
      if (!el) return;
      try { render(JSON.parse(el.textContent).rows); } catch (e) { /* leave noscript row */ }
    };
    /* Zero-network contract: always render from the inline mirror — the page
       works under connect-src 'none', offline, and from file://. Keep the
       inline #evidence-fallback JSON identical to content/evidence.sample.json
       (editing convention; the file remains the canonical editable source). */
    fallback();
  }
})();
