(function (g) {
  class Drag {
    constructor(app) {
      this.app = app;
      this.active = null;
      document.addEventListener("pointermove", (e) => {
        if (
          this.active &&
          !this.active.keyboard &&
          e.pointerId === this.active.pointerId
        ) {
          e.preventDefault();
          this.move(e.clientX, e.clientY);
        }
      });
      document.addEventListener("pointerup", (e) => {
        if (this.active && e.pointerId === this.active.pointerId) {
          this.move(e.clientX, e.clientY);
          this.finish();
        }
      });
      document.addEventListener("pointercancel", () => this.cancel());
      window.addEventListener("blur", () => this.cancel());
      window.addEventListener("resize", () => this.cancel());
      document.addEventListener("keydown", (e) => this.key(e));
    }
    point(x, y) {
      return new DOMPoint(x, y).matrixTransform(
        UI.$("map").getScreenCTM().inverse(),
      );
    }
    begin(p, card, keyboard) {
      this.cancel();
      this.app.select(p.id);
      const b = Geometry.bounds(p.geometry),
        center = [b.x + b.w / 2, b.y + b.h / 2];
      const el = UI.svg("g", { class: "ghost" });
      el.style.setProperty("--piece", UI.color(p.states[0]));
      el.append(
        UI.svg("path", {
          d: Geometry.path(p.geometry),
          "fill-rule": "evenodd",
        }),
      );
      UI.$("dragLayer").append(el);
      card.classList.add("dragging");
      this.active = { p, card, keyboard, center, el, dx: 0, dy: 0 };
    }
    startPointer(e, p, card) {
      if (e.button !== 0 || this.app.puzzle.placed.has(p.id)) return;
      e.preventDefault();
      this.begin(p, card, false);
      this.active.pointerId = e.pointerId;
      card.setPointerCapture(e.pointerId);
      this.move(e.clientX, e.clientY);
    }
    startKeyboard(p, card) {
      if (this.app.puzzle.placed.has(p.id)) return;
      this.begin(p, card, true);
      this.active.dx = 490 - this.active.center[0];
      this.active.dy = 300 - this.active.center[1];
      this.paint();
      UI.toast(
        "Arrow keys move · Shift for fine movement · Enter drops · Escape cancels",
      );
    }
    move(x, y) {
      const a = this.active;
      if (!a) return;
      const pt = this.point(x, y);
      a.dx = pt.x - a.center[0];
      a.dy = pt.y - a.center[1];
      this.paint();
    }
    paint() {
      const a = this.active;
      if (!a) return;
      const [cx, cy] = a.center;
      a.el.setAttribute(
        "transform",
        `translate(${a.dx} ${a.dy}) translate(${cx} ${cy}) scale(1.04) translate(${-cx} ${-cy})`,
      );
    }
    finish() {
      const a = this.active;
      if (!a) return;
      try {
        const result = this.app.puzzle.drop(a.p.id, a.dx, a.dy, 1.04);
        this.active = null;
        a.card.classList.remove("dragging");
        if (result.accepted) {
          a.el.remove();
          this.app.accept(a.p);
        } else {
          this.returnPiece(a);
          this.app.reject(a.p);
        }
      } catch (err) {
        console.error(err);
        this.cancel();
        UI.toast("That placement could not be checked. Please try again.");
      }
    }
    returnPiece(a) {
      const rect = a.card.getBoundingClientRect(),
        pt = this.point(rect.x + rect.width / 2, rect.y + rect.height / 2),
        b = Geometry.bounds(a.p.geometry);
      const ctm = UI.$("map").getScreenCTM();
      const scale = Math.min(
        (rect.width - 25) / (b.w * ctm.a),
        (rect.height - 40) / (b.h * ctm.d),
      );
      const start = performance.now(),
        from = [a.dx, a.dy],
        to = [pt.x - a.center[0], pt.y - a.center[1]],
        duration = matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 250;
      const step = (now) => {
        const t = duration ? Math.min(1, (now - start) / duration) : 1,
          k = 1 - Math.pow(1 - t, 3),
          s = 1.04 + (scale - 1.04) * k;
        const [cx, cy] = a.center;
        a.el.setAttribute(
          "transform",
          `translate(${from[0] + (to[0] - from[0]) * k} ${from[1] + (to[1] - from[1]) * k}) translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`,
        );
        if (t < 1) requestAnimationFrame(step);
        else {
          a.el.remove();
          a.card.classList.add("returning");
          setTimeout(() => a.card.classList.remove("returning"), 350);
        }
      };
      requestAnimationFrame(step);
    }
    cancel() {
      if (!this.active) return;
      this.active.el.remove();
      this.active.card.classList.remove("dragging");
      this.active = null;
    }
    key(e) {
      const a = this.active;
      if (!a) return;
      if (e.key === "Escape") {
        e.preventDefault();
        this.cancel();
        return;
      }
      if (!a.keyboard) return;
      if (["Enter", " "].includes(e.key)) {
        e.preventDefault();
        this.finish();
        return;
      }
      const delta = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[e.key];
      if (delta) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 12;
        a.dx += delta[0] * step;
        a.dy += delta[1] * step;
        this.paint();
      }
    }
  }
  g.Drag = Drag;
})(globalThis);
