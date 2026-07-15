/* AgX public site — "The workspace, after a run" scripted tour.
   Progressive enhancement only: without JS the section renders its final
   state as stacked panels. Every agent reply is PRE-SCRIPTED and every
   number is an illustrative placeholder — this file contains no model,
   no network calls, no storage. */
(function () {
  "use strict";

  var ws = document.getElementById("ws");
  if (!ws) return;

  /* Re-check at each animation so a mid-session OS preference change is honored. */
  function reducedMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- element handles ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var chat = $("ws-chat"), chips = $("ws-chips"), form = $("ws-form"),
      input = $("ws-input"), contextChip = $("ws-context"),
      tabsBar = $("ws-tabs"), askChip = $("ws-ask-chip"),
      docLocked = $("ws-doc-locked"), docFinal = $("ws-doc-final"),
      steerNote = $("ws-steer-note"), sweepNote = $("ws-sweep-note"),
      finalNote = $("ws-final-note"), row3res = $("ws-row3-res"),
      row3chip = $("ws-row3-chip"), dagBadge = $("ws-dag-badge"),
      step4flag = $("ws-step4-flag"), row3 = $("ws-row3");
  var views = Array.prototype.slice.call(ws.querySelectorAll(".ws-view"));
  var goal = { g2: $("ws-goal-g2"), g3: $("ws-goal-g3") };
  /* If any required element is missing, leave the pre-rendered (no-JS) state. */
  if (!chat || !chips || !form || !input || !contextChip || !tabsBar ||
      !askChip || !docLocked || !docFinal || !steerNote || !sweepNote ||
      !finalNote || !row3res || !row3chip || !dagBadge || !step4flag ||
      !row3 || !goal.g2 || !goal.g3 || views.length === 0) {
    return;
  }

  /* ---------- tabs (Graph | Plan | Report | Doc) ---------- */
  var tabs = [];
  function selectTab(idx, focus) {
    tabs.forEach(function (t, i) {
      var on = i === idx;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      views[i].hidden = !on;
    });
    if (focus) tabs[idx].focus();
  }
  function buildTabs() {
    tabsBar.setAttribute("role", "tablist");
    views.forEach(function (v, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ws-tab";
      b.id = "ws-tab-" + i;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", v.id);
      b.textContent = v.getAttribute("data-view");
      v.setAttribute("role", "tabpanel");
      v.setAttribute("aria-labelledby", b.id);
      v.tabIndex = 0;
      b.addEventListener("click", function () { selectTab(i); });
      b.addEventListener("keydown", function (ev) {
        var n = null;
        if (ev.key === "ArrowRight") n = (i + 1) % tabs.length;
        else if (ev.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        else if (ev.key === "Home") n = 0;
        else if (ev.key === "End") n = tabs.length - 1;
        if (n !== null) { ev.preventDefault(); selectTab(n, true); }
      });
      tabsBar.appendChild(b);
      tabs.push(b);
    });
    selectTab(0);
  }
  function switchToView(name) {
    var i = views.findIndex(function (v) { return v.getAttribute("data-view") === name; });
    if (i >= 0) selectTab(i);
  }

  /* ---------- chat ---------- */
  function msg(who, text) {
    var div = document.createElement("div");
    div.className = "ws-msg ws-msg-" + who;
    var p = document.createElement("p");
    p.textContent = text;
    div.appendChild(p);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
  /* Hard-coded (NOT read from the DOM): the HTML ships the FINAL agent message
     for no-JS readers, so the initial one must live here. */
  var initialAgentMsg = "Run complete: steps 01–04 done. The verifier flagged " +
    "sample 3 — residual 5.2×* the declared noise. Pick a suggested action " +
    "or type below. (Scripted demo.)";

  /* ---------- selection context (plan steps / graph nodes / flagged row) ---------- */
  var selectedStep = null;
  function setContext(step, label) {
    selectedStep = step;
    contextChip.hidden = false;
    contextChip.textContent = "context: " + label;
    ws.querySelectorAll("[data-selected]").forEach(function (el) {
      el.removeAttribute("data-selected");
    });
    ws.querySelectorAll('[data-step="' + step + '"]').forEach(function (el) {
      el.setAttribute("data-selected", "true");
    });
    if ($("ws-row3") === document.activeElement || step === "row3") {
      ws.querySelector("#ws-row3").setAttribute("data-selected", "true");
    }
    askChip.textContent = (step === "04" || step === "row3")
      ? "Ask about step 04: why is sample 3 flagged?"
      : "Ask: why is sample 3 flagged?";
  }
  ws.addEventListener("click", function (ev) {
    var stepBtn = ev.target.closest(".ws-step-btn");
    if (stepBtn) {
      var li = stepBtn.closest(".ws-step");
      setContext(li.getAttribute("data-step"),
                 "step " + li.getAttribute("data-step"));
      return;
    }
    var node = ev.target.closest(".ws-node");
    if (node && !node.classList.contains("ws-hidden")) {
      var s = node.getAttribute("data-step");
      setContext(s, s === "00" ? "measurement y" : "step " + s);
    }
  });
  ws.querySelectorAll(".ws-node").forEach(function (node) {
    node.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    });
  });
  row3.addEventListener("click", function () { setContext("row3", "sample 3 (report row)"); });
  row3.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); row3.click(); }
  });

  /* ---------- goal + status helpers ---------- */
  function setGoal(el, state, text) {
    el.setAttribute("data-state", state);
    el.querySelector(".ws-goal-state").textContent = text;
  }
  function stepStatus(stepNo, status) {
    var chip = ws.querySelector('.ws-step[data-step="' + stepNo + '"] .ws-status');
    if (chip) { chip.setAttribute("data-status", status); chip.textContent = status; }
  }
  function showStep(stepNo, show) {
    var li = ws.querySelector('.ws-step[data-step="' + stepNo + '"]');
    if (li) li.hidden = !show;
  }
  function showNode(cls, show) {
    /* SVG elements ignore the HTML `hidden` IDL property — use a class. */
    ws.querySelectorAll("." + cls).forEach(function (el) {
      el.classList.toggle("ws-hidden", !show);
    });
  }
  /* Animate queued → running → done (~2s), or jump straight to done.
     Timers are tracked so Reset mid-animation cannot fire a stale status
     mutation onto the freshly reset state. */
  var pendingTimers = [];
  var busy = false;   /* an animated step is in flight — acts wait for it */
  function later(fn, ms) { pendingTimers.push(setTimeout(fn, ms)); }
  function clearPending() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
    busy = false;
  }
  function runStep(stepNo, done) {
    if (reducedMotion()) { stepStatus(stepNo, "done"); if (done) done(); return; }
    busy = true;
    refreshChips();
    stepStatus(stepNo, "queued");
    later(function () { stepStatus(stepNo, "running"); }, 650);
    later(function () {
      stepStatus(stepNo, "done");
      busy = false;
      if (done) done();
      refreshChips();
    }, 2000);
  }

  /* ---------- the 5 acts ---------- */
  var act = 0;
  var ACTS = [
    null,
    { rx: /steer|noise regime|priorit/i,
      run: function () {
        msg("agent", "Noted — steering the controller toward the high-noise regime. The sweep " +
          "grid is re-weighted toward σ-high cases; nothing already verified is discarded. " +
          "Plan step 03 now carries the steering note (demo).");
        steerNote.hidden = false;
        switchToView("Plan");
      } },
    { rx: /sweep|add (a )?step|lambda|λ/i,
      run: function () {
        msg("agent", "Queued step 05 — λ sweep on the validation split only; the test split " +
          "stays held out. Watch Plan and Graph; Report notes the frozen best λ when it lands (demo).");
        showStep("05", true);
        showNode("ws-dag-n5", true);
        showNode("ws-dag-e5", true);
        switchToView("Plan");
        runStep("05", function () { sweepNote.hidden = false; });
      } },
    { rx: /why|flag|sample 3|question|ask/i,
      run: function () {
        msg("agent", "Verifier record demo-0003: residual 5.2×* the declared noise → " +
          "physics-inconsistent, regardless of image-space metrics. The pattern matches a " +
          "forward-model intensity-scaling mismatch on that sample, not solver failure — see " +
          "the flagged row in Report. Suggested fix: correct the scaling and re-run sample 3 (demo).");
        switchToView("Report");
      } },
    { rx: /improve|fix|re-?run|correct/i,
      run: function () {
        msg("agent", "Queued step 06 — re-run sample 3 with corrected forward-model scaling (demo).");
        showStep("06", true);
        showNode("ws-dag-n6", true);
        showNode("ws-dag-e6", true);
        switchToView("Report");
        runStep("06", function () {
          row3res.textContent = "1.1×*";
          row3chip.textContent = "PASS";
          row3chip.classList.remove("ws-chip-flag");
          dagBadge.textContent = "0 flags";
          step4flag.hidden = true;
          setGoal(goal.g2, "met", "met (demo)");
          msg("agent", "Re-run landed: residual 1.1×* the declared noise → PASS. " +
            "All samples now within the declared-noise gate (demo).");
        });
      } },
    { rx: /report|doc|final|assemble|publish/i,
      run: function () {
        msg("agent", "Assembling: step 07 gathers every record id, regenerates the figure from " +
          "frozen arrays, and emits the report and the publication-style doc (demo).");
        showStep("07", true);
        runStep("07", function () {
          finalNote.hidden = false;
          setGoal(goal.g3, "met", "met (demo)");
          docLocked.hidden = true;
          docFinal.hidden = false;
          switchToView("Doc");
          msg("agent", "Done — a publication-style report and doc, every number still an " +
            "illustrative placeholder until the sealed evidence is revealed.");
        });
      } },
  ];
  var CHIP_LABELS = ["", "Steer: prioritize the high-noise regime",
    "Add step: λ sweep on validation", "Ask: why is sample 3 flagged?",
    "Improve sample 3 (corrected scaling)", "Assemble the publication-style report + doc"];

  function refreshChips() {
    chips.querySelectorAll(".ws-chipbtn[data-act]").forEach(function (b) {
      var n = parseInt(b.getAttribute("data-act"), 10);
      var enabled = !busy && n === act + 1;
      b.setAttribute("aria-disabled", enabled ? "false" : "true");
      b.classList.toggle("ws-chip-done", n <= act);
    });
  }
  function tryAct(n) {
    if (busy) {
      msg("agent", "(Scripted demo.) A step is still running — one moment.");
      return false;
    }
    if (n === act + 1 && ACTS[n]) {
      act = n;
      ACTS[n].run();
      refreshChips();
      return true;
    }
    if (n <= act) {
      msg("agent", "(Scripted demo.) That step already ran. Next: “" +
        (CHIP_LABELS[act + 1] || "Reset demo") + "”.");
    } else {
      msg("agent", "(Scripted demo.) The tour runs in order — next: “" +
        CHIP_LABELS[act + 1] + "”.");
    }
    return false;
  }
  function matchIntent(text) {
    /* Prefer the next expected act so input matching two acts (e.g. "steer
       and add a step") advances the tour instead of replaying a done act. */
    if (ACTS[act + 1] && ACTS[act + 1].rx.test(text)) return act + 1;
    for (var n = 1; n < ACTS.length; n++) {
      if (ACTS[n].rx.test(text)) return n;
    }
    return 0;
  }

  chips.addEventListener("click", function (ev) {
    var b = ev.target.closest(".ws-chipbtn");
    if (!b) return;
    if (b.id === "ws-reset") { reset(); return; }
    var n = parseInt(b.getAttribute("data-act"), 10);
    if (b.getAttribute("aria-disabled") === "true") {
      tryAct(n);           /* guidance only — no fake user prompt in the log */
      return;
    }
    msg("user", b.textContent);
    tryAct(n);
  });

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var text = (input.value || "").trim();
    if (!text) return;
    msg("user", text);
    input.value = "";
    var n = matchIntent(text);
    if (n === 0) {
      msg("agent", "(Scripted demo.) I can demonstrate: steering the run, adding a future " +
        "step, asking about a flagged step, improving a result, or assembling the " +
        "publication-style report and doc.");
      return;
    }
    tryAct(n);
  });

  /* ---------- initial state (HTML ships the FINAL state for no-JS) ---------- */
  function toInitial() {
    act = 0;
    steerNote.hidden = true;
    sweepNote.hidden = true;
    finalNote.hidden = true;
    ["05", "06", "07"].forEach(function (s) {
      showStep(s, false);
      stepStatus(s, "queued");   /* clear any mid-animation status */
    });
    showNode("ws-dag-n5", false); showNode("ws-dag-e5", false);
    showNode("ws-dag-n6", false); showNode("ws-dag-e6", false);
    row3res.textContent = "5.2×*";
    row3chip.textContent = "FLAGGED";
    row3chip.classList.add("ws-chip-flag");
    dagBadge.textContent = "1 flag";
    step4flag.hidden = false;
    setGoal(goal.g2, "flag", "sample 3 flagged (demo)");
    setGoal(goal.g3, "pending", "pending (demo)");
    docFinal.hidden = true;
    docLocked.hidden = false;
    contextChip.hidden = true;
    selectedStep = null;
    askChip.textContent = CHIP_LABELS[3];
    ws.querySelectorAll("[data-selected]").forEach(function (el) {
      el.removeAttribute("data-selected");
    });
    refreshChips();
  }
  function reset() {
    clearPending();
    toInitial();
    chat.textContent = "";
    msg("agent", initialAgentMsg);
    switchToView("Graph");
  }

  ws.classList.add("js");
  buildTabs();
  /* The HTML ships the FINAL state (goals met, final chat, doc open) for
     no-JS readers; reset() rewinds everything to the interactive start. */
  reset();
})();
