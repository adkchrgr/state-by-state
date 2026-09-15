(function (g) {
  const $ = (id) => document.getElementById(id),
    ns = "http://www.w3.org/2000/svg";
  function svg(tag, attrs = {}) {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }
  const colors = [
    "#91bfb0",
    "#d5bc88",
    "#8fb5ce",
    "#b6a3c8",
    "#b9c786",
    "#d2a690",
  ];
  function color(id) {
    return (
      colors[STATES.findIndex((s) => s.id === id) % colors.length] || colors[0]
    );
  }
  let timer;
  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => $("toast").classList.remove("show"), 3600);
  }
  function pulse(ids, kind = "hinting") {
    for (const id of ids) {
      const p = $("state-" + id);
      p.classList.remove(kind);
      void p.getBoundingClientRect();
      p.classList.add(kind);
      setTimeout(
        () => p.classList.remove(kind),
        kind === "hinting" ? 2500 : 700,
      );
    }
  }
  function render(app) {
    const { puzzle, settings } = app,
      active = new Set(puzzle.pieces.flatMap((p) => p.states)),
      placed = new Set(
        puzzle.pieces
          .filter((p) => puzzle.placed.has(p.id))
          .flatMap((p) => p.states),
      );
    $("targets").replaceChildren();
    $("mapLabels").replaceChildren();
    const external = {
      VT: [864, 30],
      NH: [936, 40],
      MA: [965, 75],
      RI: [972, 103],
      CT: [958, 132],
      NJ: [939, 180],
      DE: [950, 212],
      MD: [932, 243],
    };
    for (const s of STATES) {
      const p = svg("path", {
        id: "state-" + s.id,
        d: Geometry.path(s.geometry),
        class:
          "target" +
          (!active.has(s.id) ? " inactive" : "") +
          (placed.has(s.id) ? " placed" : ""),
        "fill-rule": "evenodd",
      });
      p.style.setProperty("--piece", color(s.id));
      $("targets").append(p);
      if (placed.has(s.id) && settings.learning && settings.labels) {
        const b = Geometry.bounds(s.geometry);
        let x = b.x + b.w / 2,
          y = b.y + b.h / 2;
        if (external[s.id]) {
          const [lx, ly] = external[s.id];
          $("mapLabels").append(
            svg("path", {
              d: `M${x},${y}L${lx - 3},${ly - 4}`,
              class: "leader",
            }),
          );
          x = lx;
          y = ly;
        }
        const t = svg("text", { x, y, class: "map-label" });
        t.textContent = external[s.id] ? s.name : s.id;
        $("mapLabels").append(t);
      }
    }
    $("tray").replaceChildren();
    let index = 0;
    for (const id of app.order) {
      const p = puzzle.pieces.find((p) => p.id === id);
      if (puzzle.placed.has(id)) continue;
      const b = Geometry.bounds(p.geometry),
        card = document.createElement("button");
      card.className = "piece-card" + (app.selected === id ? " selected" : "");
      card.dataset.id = id;
      card.style.setProperty("--piece", color(p.states[0]));
      const named = settings.learning && settings.labels;
      card.setAttribute(
        "aria-label",
        named ? p.name : `Unplaced shape ${++index}`,
      );
      const v = svg("svg", {
        viewBox: `${b.x - 8} ${b.y - 8} ${b.w + 16} ${b.h + 16}`,
        "aria-hidden": "true",
      });
      v.append(
        svg("path", { d: Geometry.path(p.geometry), "fill-rule": "evenodd" }),
      );
      const label = document.createElement("span");
      label.textContent = named ? p.name : "Identify this shape";
      card.append(v, label);
      card.addEventListener("pointerdown", (e) =>
        app.drag.startPointer(e, p, card),
      );
      card.addEventListener("click", (e) => {
        if (e.detail === 0) app.drag.startKeyboard(p, card);
      });
      card.addEventListener("focus", () => app.select(id));
      $("tray").append(card);
    }
    if (puzzle.progress === puzzle.total) {
      const empty = document.createElement("div");
      empty.className = "tray-empty";
      empty.textContent = "Every piece has found its place. ✓";
      $("tray").append(empty);
    }
    $("boardTitle").textContent =
      settings.mode === "all"
        ? "The United States"
        : Modes.modes[settings.mode].name;
    $("modeBadge").textContent =
      `${puzzle.total} ${settings.mode === "colonies" ? "colonies" : "states"} · ${settings.learning ? "your pace" : "challenge"}`;
    $("history").textContent =
      settings.mode === "colonies"
        ? "Uses today’s state boundaries. Maryland + Delaware share one piece."
        : "";
    $("remaining").textContent = puzzle.pieces.length - puzzle.placed.size;
    $("progressText").textContent =
      `${puzzle.progress} / ${puzzle.total} ${settings.mode === "colonies" ? "colonies" : "states"} placed`;
    $("progress").max = puzzle.total;
    $("progress").value = puzzle.progress;
    $("hint").disabled = !settings.learning || puzzle.progress === puzzle.total;
    $("labels").disabled = !settings.learning;
    $("instructions").textContent = settings.learning
      ? "Drag a piece onto its outline. Close counts."
      : "Match each shape from memory. The same forgiving drop rule applies.";
  }
  const api = { $, svg, color, toast, pulse, render };
  g.UI = api;
})(globalThis);
