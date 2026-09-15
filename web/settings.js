(function (g) {
  const defaults = {
    mode: "all",
    learning: true,
    labels: true,
    sound: false,
    facts: true,
    threshold: 0.3,
  };
  function sanitize(x = {}) {
    const d = { ...defaults };
    if (
      [
        "all",
        "colonies",
        "northeast",
        "southeast",
        "midwest",
        "southwest",
        "west",
      ].includes(x.mode)
    )
      d.mode = x.mode;
    for (const k of ["learning", "labels", "sound", "facts"])
      if (typeof x[k] === "boolean") d[k] = x[k];
    if ([0.2, 0.3, 0.5, 0.7].includes(x.threshold)) d.threshold = x.threshold;
    return d;
  }
  function load(storage) {
    try {
      return sanitize(JSON.parse(storage.getItem("atlas-settings-v1")) || {});
    } catch {
      return { ...defaults };
    }
  }
  function save(storage, x) {
    try {
      storage.setItem("atlas-settings-v1", JSON.stringify(sanitize(x)));
      return true;
    } catch {
      return false;
    }
  }
  const api = { defaults, sanitize, load, save };
  if (typeof module !== "undefined") module.exports = api;
  else g.Settings = api;
})(globalThis);
