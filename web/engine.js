(function (g) {
  const G =
    typeof module !== "undefined" ? require("./geometry.js") : g.Geometry;
  class Puzzle {
    constructor(pieces, threshold = 0.3) {
      this.pieces = pieces;
      this.threshold = threshold;
      this.reset();
    }
    reset() {
      this.placed = new Set();
      this.attempts = 0;
      this.failures = {};
    }
    get progress() {
      return this.pieces
        .filter((p) => this.placed.has(p.id))
        .reduce((n, p) => n + p.states.length, 0);
    }
    get total() {
      return this.pieces.reduce((n, p) => n + p.states.length, 0);
    }
    drop(id, dx, dy, scale = 1) {
      const p = this.pieces.find((p) => p.id === id);
      if (!p || this.placed.has(id))
        return { accepted: false, locked: this.placed.has(id) };
      const b = G.bounds(p.geometry);
      const moving = G.transform(p.geometry, dx, dy, scale, [
        b.x + b.w / 2,
        b.y + b.h / 2,
      ]);
      const ratio = G.overlap(p.geometry, moving);
      this.attempts++;
      if (ratio + 1e-9 >= this.threshold) {
        this.placed.add(id);
        return { accepted: true, ratio, dx: 0, dy: 0, scale: 1, locked: true };
      }
      this.failures[id] = (this.failures[id] || 0) + 1;
      return { accepted: false, ratio };
    }
  }
  if (typeof module !== "undefined") module.exports = Puzzle;
  else g.Puzzle = Puzzle;
})(globalThis);
