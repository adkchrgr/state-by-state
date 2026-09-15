# State by State

An offline United States geography puzzle in a small native macOS window. Real state-shaped pieces, a dark outline board, and forgiving placement. No accounts, backend, telemetry, subscription, or internet connection during play.

## Launch on your Mac

Requires **macOS 13 Ventura or later**, on Apple Silicon or Intel.

1. Unzip this project. Keep its folders together.
2. Install Apple's free Command Line Tools once, if you do not already have them. Open Terminal and run:

   ```bash
   xcode-select --install
   ```

   Complete the installer before continuing. This one-time installation needs internet access; the app build itself does not download anything.

3. In Terminal, type `cd ` (with a space), drag the unzipped `us-geography` folder into Terminal, and press Return. Then run:

   ```bash
   bash build-macos.sh --launch
   ```

4. The build creates **`dist/State by State.app`**. Drag that app to Applications. Thereafter, double-click it like any other Mac app; Terminal and developer tools are not needed for playing.

Alternatively, double-click **`launch-macos.command`** after installing the Command Line Tools. The Terminal command above is the reliable fallback if Finder will not execute a downloaded script. This is a locally built, ad-hoc-signed app, not a notarized App Store download. If macOS blocks opening it, use Finder's Open action or the specific Open Anyway option in Privacy & Security; do not disable system-wide security settings.

The build targets the architecture of the Mac that builds it. Build on each architecture if distributing to both Intel and Apple Silicon Macs. No Node, npm, Python, Rust, Electron, Tauri, Xcode project assembly, or third-party runtime is required for the normal macOS build.

## Try the puzzle immediately

Open **`web/index.html`** directly in Safari or Chrome. All scripts, styles, and map data are bundled. This browser preview also works offline. Preference storage is browser-specific and may be unavailable in private browsing; app and browser preferences are separate.

## How to play

- Pick **All 50 States**, **13 Original Colonies**, or one of five regions.
- Drag a shape from the Available States tray, then release it over its destination. At least **30% of the dragged shape's area** must overlap its correct outline. Merely moving over a target does not place it.
- Success snaps the piece exactly into place, locks it, and flashes its boundary for 650 ms. Misses gently return to the tray.
- Colony mode has **12 pieces representing 13 colonies**. Maryland + Delaware are one draggable object. Placing it advances progress by two and preserves both state boundaries on the board.
- **Learning** shows names and allows hints, with no timer. **Challenge** hides names on unplaced pieces and map labels, disables hints and automatic target help, and records elapsed time and drop accuracy. Successful placements still reveal the state's name to reinforce learning.
- **Show State Names** controls tray names and placed map labels in Learning. Larger states use postal abbreviations on the map; small northeastern states have external name labels and leader lines.
- Press **Hint** to select a remaining piece and pulse its outline. Repeating a hint reveals its name. Three missed drops also pulse the target in Learning.
- **Settings** offers facts and overlap thresholds of 20%, 30%, 50%, or 70%. Sound has its own visible toggle and starts off.
- Reset retains tray order; New Puzzle shuffles it. Switching puzzle or play style starts a fresh puzzle. After progress, these actions request confirmation.
- Preferences persist locally. **Unfinished puzzle progress is not saved**; a launch begins a fresh puzzle. The challenge clock measures elapsed time, including time in dialogs or away from the window.

### Keyboard and touch

Tab reaches controls and piece cards. Enter/Space picks up the focused piece; arrow keys move it; Shift + arrows gives fine movement. Enter drops, Escape cancels, H hints, and R requests reset. A keyboard pick-up starts at the board's center. Mouse, trackpad, pen, and touch use Pointer Events, including pointer capture and cancellation. Whole tray cards are pick-up targets, giving small states more than a 16 px interaction buffer without distorting their visible shapes. Touch users scroll the tray using its gaps/scrollbar; touching a piece starts a drag. macOS reduced-motion preferences are honored, and hints remain visible without pulsing.

## Developer commands

Requires Node.js 20+ only for tests and the optional development server.

```bash
npm test                 # deterministic engine tests; no npm install required
npm run dev              # local preview at http://127.0.0.1:4173
npm run build:macos       # production .app build, on macOS
```

For browser integration tests (one-time internet download):

```bash
npm ci
npx playwright install chromium webkit
npm run test:ui
```

Linux may additionally require `npx playwright install-deps`. Native WKWebView still needs a real-Mac smoke check; Linux WebKit tests are not a macOS binary test.

Regenerate the bundled map conversion from the included source topology with `python3 scripts/prepare-data.py`. There is no need to regenerate it to build or run the app.

## Project layout

```text
us-geography/
  README.md
  THIRD_PARTY.md
  LICENSE
  VALIDATION.md
  build-macos.sh
  launch-macos.command
  package.json / package-lock.json
  playwright.config.cjs
  src/
    main.swift          Native AppKit window and offline WKWebView
    Info.plist          macOS bundle metadata
  web/
    index.html          Accessible interface and dialogs
    styles.css          Responsive dark UI and reduced-motion support
    app.js              Application coordination, feedback, timer
    ui.js               Board, tray, labels, and progress rendering
    drag.js             Pointer/keyboard movement and return animation
    engine.js           Attempts, acceptance, snapping, locking, progress
    geometry.js         Polygon area, transforms, and intersection
    modes.js            State groups and combined colony piece
    settings.js         Validated, versioned local preferences
    data/               All 50 state polygons, source topology, license
    vendor/             Bundled polygon-clipping and license notices
  scripts/
    serve.cjs           Loopback-only optional development server
    prepare-data.py     Dependency-free TopoJSON conversion
  tests/
    engine.test.cjs     Deterministic tests
    ui.spec.cjs         Pointer, keyboard, settings, completion tests
```

## Implementation decisions

The native shell uses macOS's built-in **AppKit + WKWebView**. The web interface uses plain JavaScript and SVG, avoiding a frontend build chain. Classic local scripts make direct file loading work without a server or module-fetch restrictions. The native app stores preferences in macOS UserDefaults through a small main-frame-only bridge. The browser preview uses localStorage. Navigation is restricted to bundled files; a Content Security Policy blocks network connections.

The map is the simplified 2017 Census cartographic geometry redistributed as **us-atlas 3.0.1**, projected with Albers USA and Alaska/Hawaii insets. It is an educational map, not a survey. Colonies use modern boundaries; regions are explicit practice groupings, not an assertion of one official regional standard.

The bundled **polygon-clipping 0.15.7** library calculates true polygon intersections, including islands, holes, and both parts of the MD–DE piece. The area denominator includes the 1.04× drag lift scale, matching the visible shape. Only the invisible pick-up area is enlarged; target acceptance uses actual geography. Successful engine results always return the exact target transform. Facts are derived locally from the colony and region data and can be disabled.

Third-party source links and licenses are in THIRD_PARTY.md. No map or library downloads occur at runtime.
