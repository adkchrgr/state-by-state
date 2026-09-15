(function () {
  const { $ } = UI;
  let storage;
  try {
    storage =
      typeof window.nativeSettings !== "undefined"
        ? {
            getItem: () => window.nativeSettings,
            setItem: (_key, value) => {
              window.webkit.messageHandlers.savePreferences.postMessage(value);
              window.nativeSettings = value;
            },
          }
        : localStorage;
  } catch {
    storage = {
      getItem: () => null,
      setItem: () => {
        throw Error("Unavailable");
      },
    };
  }
  const app = {
    settings: Settings.load(storage),
    selected: null,
    order: [],
    hintCounts: {},
    start: 0,
    elapsed: 0,
  };
  function save() {
    if (!Settings.save(storage, app.settings))
      UI.toast("Preferences could not be saved; this puzzle still works.");
  }
  function shuffled(ids) {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }
  app.select = (id) => {
    app.selected = id;
    document
      .querySelectorAll(".piece-card")
      .forEach((c) => c.classList.toggle("selected", c.dataset.id === id));
    const p = app.puzzle.pieces.find((p) => p.id === id);
    $("selectedText").textContent =
      app.settings.learning && p ? p.name : "Piece selected";
  };
  app.reset = (shuffle = true) => {
    app.drag?.cancel();
    app.puzzle = new Puzzle(
      Modes.pieces(STATES, app.settings.mode),
      app.settings.threshold,
    );
    if (shuffle || !app.order.length)
      app.order = shuffled(app.puzzle.pieces.map((p) => p.id));
    app.selected = null;
    app.hintCounts = {};
    app.start = performance.now();
    app.elapsed = 0;
    UI.render(app);
    $("selectedText").textContent = "Choose any piece to begin";
    updateStats();
  };
  app.hint = () => {
    if (!app.settings.learning) return;
    let p = app.puzzle.pieces.find(
      (p) => p.id === app.selected && !app.puzzle.placed.has(p.id),
    );
    if (!p) p = app.puzzle.pieces.find((p) => !app.puzzle.placed.has(p.id));
    if (!p) return;
    app.select(p.id);
    const n = (app.hintCounts[p.id] = (app.hintCounts[p.id] || 0) + 1);
    UI.pulse(p.states);
    UI.toast(
      n === 1
        ? "Look for the softly glowing outline."
        : `${p.name} belongs in the glowing outline.`,
    );
    document
      .querySelector(`[data-id="${p.id}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };
  let audio;
  function tone() {
    if (!app.settings.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
      const osc = audio.createOscillator(),
        gain = audio.createGain();
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.frequency.setValueAtTime(587, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, audio.currentTime + 0.13);
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.09, audio.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.25);
      osc.start();
      osc.stop(audio.currentTime + 0.26);
    } catch {}
  }
  app.accept = (p) => {
    app.elapsed = performance.now() - app.start;
    UI.render(app);
    UI.pulse(p.states, "flash");
    tone();
    let text =
      p.id === "MD-DE"
        ? "Maryland + Delaware ✓ — 2 colonies placed"
        : `${p.name} ✓`;
    if (app.settings.facts && app.settings.learning) {
      const region = Object.entries(Modes.regions).find(([, ids]) =>
        ids.split(" ").includes(p.states[0]),
      )?.[0];
      text += Modes.colonies.includes(p.states[0])
        ? " · One of the original 13 colonies."
        : ` · Find it in our ${region} region.`;
    }
    UI.toast(text);
    app.selected = null;
    $("selectedText").textContent = "Nicely placed. Choose another piece.";
    updateStats();
    if (app.puzzle.progress === app.puzzle.total) {
      $("map").classList.add("celebrate");
      $("completeTitle").textContent =
        app.settings.mode === "all"
          ? "United States Complete"
          : app.settings.mode === "colonies"
            ? "Original 13 Colonies Complete"
            : `${Modes.modes[app.settings.mode].name} Complete`;
      $("completeDetail").textContent =
        `${app.puzzle.progress} / ${app.puzzle.total} ${app.settings.mode === "colonies" ? "colonies" : "states"}${app.settings.learning ? " — beautifully put together." : " · " + $("stats").textContent}`;
      setTimeout(() => {
        $("map").classList.remove("celebrate");
        if (app.puzzle.progress === app.puzzle.total)
          $("completeDialog").showModal();
      }, 750);
    } else {
      document.querySelector(".piece-card")?.focus({ preventScroll: true });
    }
  };
  app.reject = (p) => {
    if (app.settings.learning && (app.puzzle.failures[p.id] || 0) >= 3) {
      UI.pulse(p.states);
      UI.toast("A little nudge: look for the glowing outline.");
    } else UI.toast("Try another spot. You only need a partial match.");
    updateStats();
  };
  function updateStats() {
    if (app.settings.learning) {
      $("stats").textContent = "No timer. Take your time.";
      return;
    }
    const ms =
        app.puzzle.progress === app.puzzle.total
          ? app.elapsed
          : performance.now() - app.start,
      secs = Math.floor(ms / 1000);
    $("stats").textContent =
      `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} · ${app.puzzle.attempts} drops${app.puzzle.attempts ? " · " + Math.round((app.puzzle.placed.size / app.puzzle.attempts) * 100) + "% accuracy" : ""}`;
  }
  for (const [id, m] of Object.entries(Modes.modes)) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = ["all", "colonies"].includes(id)
      ? m.name
      : `Region · ${m.name}`;
    $("mode").append(o);
  }
  function sync() {
    $("mode").value = app.settings.mode;
    $("style").value = app.settings.learning ? "learning" : "challenge";
    $("labels").checked = app.settings.labels;
    $("sound").textContent = app.settings.sound ? "Sound on" : "Sound off";
    $("sound").setAttribute("aria-pressed", app.settings.sound);
    $("facts").checked = app.settings.facts;
    $("threshold").value = String(app.settings.threshold);
  }
  let pending;
  function confirmAction(action) {
    app.drag.cancel();
    if (app.puzzle.progress === 0) {
      action();
      return;
    }
    pending = action;
    $("confirmDialog").showModal();
  }
  $("mode").onchange = () => {
    const mode = $("mode").value;
    sync();
    confirmAction(() => {
      app.settings.mode = mode;
      save();
      sync();
      app.reset();
    });
  };
  $("style").onchange = () => {
    const learning = $("style").value === "learning";
    sync();
    confirmAction(() => {
      app.settings.learning = learning;
      save();
      sync();
      app.reset();
    });
  };
  $("labels").onchange = () => {
    app.drag.cancel();
    app.settings.labels = $("labels").checked;
    save();
    UI.render(app);
  };
  $("sound").onclick = () => {
    app.settings.sound = !app.settings.sound;
    save();
    sync();
    if (app.settings.sound) tone();
  };
  $("facts").onchange = () => {
    app.settings.facts = $("facts").checked;
    save();
  };
  $("threshold").onchange = () => {
    app.settings.threshold = Number($("threshold").value);
    app.puzzle.threshold = app.settings.threshold;
    save();
  };
  $("settingsButton").onclick = () => {
    app.drag.cancel();
    $("settingsDialog").showModal();
  };
  $("hint").onclick = app.hint;
  $("reset").onclick = () => confirmAction(() => app.reset(false));
  $("shuffle").onclick = () => confirmAction(() => app.reset(true));
  $("cancelReset").onclick = () => {
    $("confirmDialog").close();
    pending = null;
  };
  $("confirmReset").onclick = () => {
    $("confirmDialog").close();
    pending?.();
    pending = null;
  };
  $("again").onclick = () => {
    $("completeDialog").close();
    app.reset();
  };
  $("changeMode").onclick = () => {
    $("completeDialog").close();
    $("mode").focus();
  };
  document.addEventListener("keydown", (e) => {
    if (
      e.defaultPrevented ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      document.querySelector("dialog[open]") ||
      ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)
    )
      return;
    if (e.key.toLowerCase() === "h") {
      e.preventDefault();
      app.hint();
    }
    if (e.key.toLowerCase() === "r" && !e.repeat) {
      e.preventDefault();
      confirmAction(() => app.reset(false));
    }
  });
  app.drag = new Drag(app);
  sync();
  app.reset();
  setInterval(updateStats, 1000);
  // Exposed for deterministic integration testing and local developer inspection.
  window.geographyApp = app;
})();
