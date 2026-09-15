(function (g) {
  const clip =
    typeof module !== "undefined"
      ? require("./vendor/polygon-clipping.js")
      : g.polygonClipping;
  function ringArea(r) {
    let a = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++)
      a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
    return Math.abs(a) / 2;
  }
  function area(m) {
    return m.reduce(
      (a, p) =>
        a + ringArea(p[0]) - p.slice(1).reduce((s, r) => s + ringArea(r), 0),
      0,
    );
  }
  function bounds(m) {
    const p = m.flat(2);
    const xs = p.map((p) => p[0]),
      ys = p.map((p) => p[1]);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    };
  }
  function transform(m, dx = 0, dy = 0, scale = 1, center = [0, 0]) {
    return m.map((p) =>
      p.map((r) =>
        r.map(([x, y]) => [
          center[0] + (x - center[0]) * scale + dx,
          center[1] + (y - center[1]) * scale + dy,
        ]),
      ),
    );
  }
  function overlap(target, moving) {
    const a = area(moving);
    return a
      ? Math.min(1, Math.max(0, area(clip.intersection(target, moving)) / a))
      : 0;
  }
  function path(m) {
    return m
      .map((p) =>
        p.map((r) => "M" + r.map((p) => p.join(",")).join("L") + "Z").join(""),
      )
      .join("");
  }
  const api = {
    area,
    bounds,
    transform,
    overlap,
    path,
    union: (...m) => clip.union(...m),
  };
  if (typeof module !== "undefined") module.exports = api;
  else g.Geometry = api;
})(globalThis);
