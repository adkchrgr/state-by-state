# Third-party notices

- **us-atlas 3.0.1** — projected `states-albers-10m.json`, derived from the U.S. Census Bureau's 2017 cartographic boundary files. Source: https://github.com/topojson/us-atlas and https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-albers-10m.json. The original source file and ISC license are included under `web/data/`. `states.js` is generated from this file, excluding non-state jurisdictions, retaining projected polygons. See `web/data/us-atlas.LICENSE`.
- **polygon-clipping 0.15.7** — MIT, Mike Fogel and contributors. Source: https://github.com/mfogel/polygon-clipping. Bundled distribution obtained from https://cdn.jsdelivr.net/npm/polygon-clipping@0.15.7/dist/polygon-clipping.umd.min.js. License: `web/vendor/polygon-clipping.LICENSE.md`. The UMD bundle incorporates **splaytree 3.1.2** (MIT, Alexander Milevski), with its license notice retained and the full license in `web/vendor/splaytree.LICENSE`, and robust orientation-predicate code (Unlicense; notice in `web/vendor/robust-predicates.LICENSE`).
- **Playwright Test 1.55.1** — Apache-2.0, Microsoft, https://github.com/microsoft/playwright. Optional development-only dependency installed by npm; not shipped in the application runtime.

Native API reference: https://developer.apple.com/documentation/webkit/wkwebview/loadfileurl(_:allowingreadaccessto:)
