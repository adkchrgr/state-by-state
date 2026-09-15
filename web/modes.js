(function (g) {
  const regions = {
    Northeast: "ME NH VT MA RI CT NY NJ PA",
    Southeast: "DE MD VA WV KY NC SC TN GA FL AL MS AR LA",
    Midwest: "OH MI IN IL WI MN IA MO ND SD NE KS",
    Southwest: "AZ NM OK TX",
    West: "WA OR CA NV ID MT WY UT CO AK HI",
  };
  const colonies = "NH MA RI CT NY NJ PA DE MD VA NC SC GA".split(" ");
  const modes = {
    all: { name: "All 50 States" },
    colonies: { name: "13 Original Colonies", ids: colonies },
    ...Object.fromEntries(
      Object.entries(regions).map(([name, ids]) => [
        name.toLowerCase(),
        { name, ids: ids.split(" ") },
      ]),
    ),
  };
  function pieces(states, mode) {
    const m = modes[mode] || modes.all;
    let list = states
      .filter((s) => !m.ids || m.ids.includes(s.id))
      .map((s) => ({ ...s, states: [s.id] }));
    if (mode === "colonies") {
      const pair = list.filter((s) => ["MD", "DE"].includes(s.id));
      list = list.filter((s) => !["MD", "DE"].includes(s.id));
      list.push({
        id: "MD-DE",
        name: "Maryland + Delaware",
        states: ["MD", "DE"],
        geometry: pair.flatMap((s) => s.geometry),
      });
    }
    return list;
  }
  const api = { modes, colonies, regions, pieces };
  if (typeof module !== "undefined") module.exports = api;
  else g.Modes = api;
})(globalThis);
