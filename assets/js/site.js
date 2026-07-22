/* AgX public site — progressive enhancement only. No network calls except a
   same-origin fetch of local sample content (with an inline fallback so the
   page also works from file://). No analytics, no cookies, no third parties. */
(function () {
  "use strict";

  /* ---------- theme toggle (localStorage only; no cookies) ---------- */
  var THEME_KEY = "agx-theme";
  var root = document.documentElement;
  var tourFrame = document.getElementById("tour-frame");
  var msgTarget = (location.origin && location.origin !== "null") ? location.origin : "*";  // file:// has an opaque "null" origin; postMessage needs "*" (receivers still validate event.source)

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
      if (tourFrame && tourFrame.contentWindow) {
        tourFrame.contentWindow.postMessage(
          { agx: "theme", mode: root.getAttribute("data-theme") || null }, msgTarget);
      }
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

    /* Glow presence + a slow "breathing" on lingering hover — pointer/hover devices only.
       The blob is visible by default (CSS: --glow-on defaults to 1); it fades out when the
       cursor leaves the page/window, and breathes after ~1.2s of stillness via a CSS keyframe
       animation on :root.breathing body::before (no rAF loop). Touch already early-returns. */
    if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var breatheTimer = null;
      var showGlow = function () { root.style.setProperty("--glow-on", "1"); };
      var hideGlow = function () {
        root.style.setProperty("--glow-on", "0");
        if (breatheTimer) { clearTimeout(breatheTimer); breatheTimer = null; }
        root.classList.remove("breathing");
      };
      document.addEventListener("pointerenter", showGlow);
      window.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        showGlow();
        root.classList.remove("breathing");
        if (breatheTimer) clearTimeout(breatheTimer);
        breatheTimer = setTimeout(function () { root.classList.add("breathing"); }, 1200);
      }, { passive: true });
      document.addEventListener("pointerleave", hideGlow);
      document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) hideGlow(); });
      window.addEventListener("blur", hideGlow);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible") hideGlow();
      });
    }
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

  /* ---------- embedded tour: start handshake, theme sync, offscreen pause ----------
     The guided tour lives in a same-origin <iframe src="tour.html?embed=1">. It stays
     paused until the visitor asks for it (a click on any #tour link); then we hand it the
     current theme and tell it to start — exactly once. Every message is origin- and
     source-validated on both sides. Iframe height is owned by the CSS clamp, so incoming
     {agx:'resize'} messages are accepted but intentionally do not override it. */
  var tourSection = document.getElementById("tour");
  if (tourFrame && tourSection && window.postMessage) {
    var frameReady = false, pendingStart = false, startedOnce = false;

    var postToFrame = function (msg) {
      if (tourFrame.contentWindow) tourFrame.contentWindow.postMessage(msg, msgTarget);
    };
    var requestStart = function () {
      if (startedOnce) return;
      if (frameReady) { startedOnce = true; postToFrame({ agx: "start" }); syncPlayback(); }
      else pendingStart = true;
    };
    var tourPoster = document.getElementById("tour-poster");
    var primed = false;
    var prime = function () {                                  // load the tour + drop the poster (no "blocking frame"); does NOT start playback
      if (primed) return; primed = true;
      tourSection.classList.add("revealed");
      tourFrame.tabIndex = 0; tourFrame.removeAttribute("aria-hidden");
      if (tourFrame.dataset && tourFrame.dataset.src && !tourFrame.getAttribute("src")) tourFrame.src = tourFrame.dataset.src;
      if (tourPoster) { tourPoster.tabIndex = -1; tourPoster.hidden = true; }
    };
    var reveal = function () {                                 // the "Watch the tour" CTA: prime + focus + play
      prime();
      tourSection.setAttribute("tabindex", "-1");
      try { tourSection.focus({ preventScroll: true }); } catch (e) {}
      requestStart();
    };
    window.__agxTourPrime = prime;                             // page controller: preload + drop the poster on load
    window.__agxTourPlay = function () { prime(); requestStart(); };   // page controller: start the demo when the tour page is reached

    /* Explicit start only — reveal the folded stage, load the tour, and play.
       Native #tour hash-scroll still happens; we move focus (a11y) + reveal + play. */
    document.querySelectorAll('a[href="#tour"]').forEach(function (a) {
      a.addEventListener("click", function () {
        tourSection.setAttribute("tabindex", "-1");
        try { tourSection.focus({ preventScroll: true }); } catch (e) { tourSection.focus(); }
        reveal();
      });
    });
    if (tourPoster) tourPoster.addEventListener("click", reveal);

    window.addEventListener("message", function (e) {
      if (e.origin !== location.origin || e.source !== tourFrame.contentWindow) return;
      var d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.agx === "ready") {
        frameReady = true;
        postToFrame({ agx: "theme", mode: root.getAttribute("data-theme") || null });
        if (pendingStart && !startedOnce) { startedOnce = true; postToFrame({ agx: "start" }); syncPlayback(); }
      }
      /* {agx:'resize'} is intentionally not applied — CSS clamp(500px,82dvh,760px) plus
         overscroll-behavior:contain own the height, so the two never fight. */
    });

    /* Offscreen / hidden tab → pause; return → resume only if it had been started. */
    tourFrame.addEventListener("load", function () { postToFrame({ agx: "hello" }); });
    postToFrame({ agx: "hello" });
    var inView = false, pageVisible = (document.visibilityState === "visible");
    var syncPlayback = function () { if (startedOnce) postToFrame({ agx: (inView && pageVisible) ? "resume" : "pause" }); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { inView = en.isIntersecting; });
        syncPlayback();
      }).observe(tourFrame);
    } else {
      inView = true;  // no IntersectionObserver: can't track the viewport, so assume visible (never leave a started tour stuck paused)
    }
    document.addEventListener("visibilitychange", function () {
      pageVisible = (document.visibilityState === "visible"); syncPlayback();
    });
  }
})();

/* Page-by-page: the hero and the tour are full-screen pages. ONE wheel/swipe/key does ONE DISCRETE page
   transition (the deck never scrolls continuously); the body below scrolls normally. Scrolling over the
   revealed tour iframe is relayed via postMessage. Progressive enhancement: no-JS + reduced-motion get
   plain continuous scrolling (the sections are just tall). */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = document.getElementById("top"), tour = document.getElementById("tour"), tourFrame = document.getElementById("tour-frame");
  var bodyEl = document.querySelector(".layout-product");
  if (reduce || !hero || !tour || !bodyEl) return;
  var sections = [hero, tour, bodyEl];   // 0 hero, 1 tour, 2 body (the body is scrollable internally)
  var idx = 0, animating = false, aTimer = null;
  var NAVH = (function () { var v = getComputedStyle(document.documentElement).getPropertyValue("--nav-h").trim(); var n = parseFloat(v) || 3; return v.indexOf("px") >= 0 ? n : n * 16; })();

  function anim() { animating = true; clearTimeout(aTimer); aTimer = setTimeout(function () { animating = false; }, 700); }
  function go(i) { idx = i; anim(); if (i === 1 && window.__agxTourPlay) window.__agxTourPlay(); sections[i].scrollIntoView({ behavior: "smooth", block: "start" }); }   // reaching the tour auto-starts the demo; scroll-margin-top clears the topbar
  function atBodyTop() { return bodyEl.getBoundingClientRect().top >= NAVH - 6; }
  function down() { if (idx < 2) go(idx + 1); }
  function up() { if (idx === 2) { if (atBodyTop()) go(1); } else if (idx > 0) go(idx - 1); }
  function isControl(t) { if (!t || !t.tagName) return false; var g = t.tagName; return g === "INPUT" || g === "TEXTAREA" || g === "SELECT" || g === "BUTTON" || g === "A" || t.isContentEditable; }
  function sync() { if (animating) return; if (bodyEl.getBoundingClientRect().top <= window.innerHeight * 0.5) idx = 2; else idx = (tour.getBoundingClientRect().top <= 80) ? 1 : 0; }

  window.addEventListener("wheel", function (e) {
    if (idx === 2) { if (e.deltaY < 0 && atBodyTop()) { e.preventDefault(); go(1); } return; }   // body: continuous, except one scroll up at its top -> tour
    e.preventDefault();                                                                          // deck: no continuous scroll
    if (animating) return;
    if (e.deltaY > 0) down(); else if (e.deltaY < 0) up();
  }, { passive: false });

  var ty = null;
  window.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchmove", function (e) { if (idx < 2) e.preventDefault(); }, { passive: false });   // block continuous swipe on the deck
  window.addEventListener("touchend", function (e) {
    if (ty === null) return; var dy = ty - e.changedTouches[0].clientY; ty = null;
    if (Math.abs(dy) < 30 || animating) return;
    if (idx === 2) { if (dy < 0 && atBodyTop()) go(1); return; }
    if (dy > 0) down(); else up();
  }, { passive: true });

  window.addEventListener("keydown", function (e) {
    if (idx === 2 || isControl(e.target)) return;
    if (e.key === "PageDown" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); down(); }
    else if (e.key === "PageUp" || e.key === "ArrowUp") { e.preventDefault(); up(); }
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var t = document.getElementById(a.getAttribute("href").slice(1)); if (!t) return;
    if (t === hero) { e.preventDefault(); go(0); }
    else if (t === tour) { e.preventDefault(); go(1); }
    else setTimeout(sync, 60);                                                                   // body anchor: default jump, then resync
  }, false);

  window.addEventListener("message", function (e) {                                              // relayed from the tour iframe (it eats the wheel)
    if (!tourFrame || e.source !== tourFrame.contentWindow) return;
    var d = e.data; if (!d || d.agx !== "framescroll" || animating) return;
    if (d.dir === "down") down(); else if (d.dir === "up") up();
  }, false);

  var st = false;
  window.addEventListener("scroll", function () { if (st) return; st = true; requestAnimationFrame(function () { st = false; sync(); }); }, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
  if (window.__agxTourPrime) window.__agxTourPrime();                                             // preload the tour + drop the poster (no blocking frame)
  sync();
  if (location.hash === "#tour" && window.__agxTourPlay) { idx = 1; window.__agxTourPlay(); }       // landed directly on the tour -> play
})();
