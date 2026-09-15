const test = require("node:test"),
  assert = require("node:assert/strict");
const G = require("../web/geometry.js"),
  Puzzle = require("../web/engine.js"),
  M = require("../web/modes.js"),
  S = require("../web/settings.js"),
  states = require("../web/data/states.js");
const square = [
  [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
  ],
];
const piece = { id: "A", states: ["A"], geometry: square };
test("exact 30% accepted and snapped; 29.9% rejected", () => {
  const p = new Puzzle([piece]);
  assert.equal(p.drop("A", 7.01, 0).accepted, false);
  const r = p.drop("A", 7, 0);
  assert.equal(r.accepted, true);
  assert.deepEqual([r.dx, r.dy, r.scale, r.locked], [0, 0, 1, true]);
});
test("wrong destination rejected, successful piece locked", () => {
  const p = new Puzzle([piece]);
  assert.equal(p.drop("A", 100, 0).accepted, false);
  assert.equal(p.progress, 0);
  assert.equal(p.drop("A", 0, 0).accepted, true);
  assert.equal(p.drop("A", 100, 0).locked, true);
  assert.equal(p.progress, 1);
  assert.equal(p.attempts, 2);
});
test("actual geometry and holes matter, not bounding boxes", () => {
  const donut = [
    [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [2, 2],
        [8, 2],
        [8, 8],
        [2, 8],
        [2, 2],
      ],
    ],
  ];
  const inside = [
    [
      [
        [3, 3],
        [7, 3],
        [7, 7],
        [3, 7],
        [3, 3],
      ],
    ],
  ];
  assert.equal(G.overlap(donut, inside), 0);
  assert.equal(G.area(donut), 64);
});
test("all real states accept centered enlarged drag and reject distant drop", () => {
  assert.equal(states.length, 50);
  for (const s of states) {
    const p = new Puzzle([{ ...s, states: [s.id] }]);
    assert.ok(G.area(s.geometry) > 0, s.id);
    assert.equal(p.drop(s.id, 2000, 2000, 1.04).accepted, false, s.id);
    assert.equal(p.drop(s.id, 0, 0, 1.04).accepted, true, s.id);
  }
});
test("colonies contain 12 pieces, Maryland/Delaware union, 13-state progress", () => {
  const pieces = M.pieces(states, "colonies"),
    p = new Puzzle(pieces),
    pair = pieces.find((p) => p.id === "MD-DE");
  assert.equal(pieces.length, 12);
  assert.deepEqual(pair.states, ["MD", "DE"]);
  const union = G.union(
    ...states.filter((s) => pair.states.includes(s.id)).map((s) => s.geometry),
  );
  assert.ok(Math.abs(G.area(pair.geometry) - G.area(union)) < 1e-6);
  assert.equal(p.drop(pair.id, 0, 0).accepted, true);
  assert.equal(p.progress, 2);
  for (const q of pieces) if (q.id !== pair.id) p.drop(q.id, 0, 0);
  assert.equal(p.progress, 13);
  assert.equal(p.total, 13);
});
test("reset clears locks attempts and failures", () => {
  const p = new Puzzle([piece]);
  p.drop("A", 100, 0);
  p.drop("A", 0, 0);
  p.reset();
  assert.equal(p.progress, 0);
  assert.equal(p.attempts, 0);
  assert.deepEqual(p.failures, {});
  assert.equal(p.drop("A", 0, 0).accepted, true);
});
test("regions partition 50 states and switching makes fresh puzzle", () => {
  const regional = Object.keys(M.regions).flatMap((r) =>
    M.pieces(states, r.toLowerCase()).map((s) => s.id),
  );
  assert.equal(regional.length, 50);
  assert.equal(new Set(regional).size, 50);
  const p = new Puzzle(M.pieces(states, "northeast"));
  assert.equal(p.total, 9);
  assert.equal(p.drop("CA", 0, 0).accepted, false);
  assert.equal(new Puzzle(M.pieces(states, "all")).total, 50);
});
test("settings round trip, validation, corrupted/unavailable storage", () => {
  let raw = null;
  const storage = {
    getItem: () => raw,
    setItem: (k, v) => {
      raw = v;
    },
  };
  const prefs = {
    ...S.defaults,
    sound: true,
    mode: "colonies",
    learning: false,
    labels: false,
    threshold: 0.5,
  };
  assert.equal(S.save(storage, prefs), true);
  assert.deepEqual(S.load(storage), prefs);
  raw = "broken";
  assert.deepEqual(S.load(storage), S.defaults);
  raw = '{"mode":"bogus","sound":"yes","threshold":0}';
  assert.deepEqual(S.load(storage), S.defaults);
  assert.equal(
    S.save(
      {
        setItem: () => {
          throw Error();
        },
      },
      prefs,
    ),
    false,
  );
});
