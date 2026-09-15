# Validation — September 15, 2026

Environment: Linux, Node.js 24.19.0, Playwright 1.55.1 / Chromium 140.

## Passed

- `npm test`: 8/8 deterministic tests. Includes the 30% boundary and 29.9% rejection, polygon holes, every real state with lift scale, wrong drops, snapping and locking, MD–DE combined geometry and 13-colony totals, reset, region membership, and persisted-setting validation.
- `npm run test:ui -- --project=chromium --workers=1`: 8/8 browser tests. Uses real mouse events for release-only snapping, incorrect drop return, Escape, MD–DE placement, reset confirmation, completion/replay; also keyboard placement, challenge hiding, preference reload, native preference-bridge simulation, responsive layout, and zero remote requests/script errors.
- Browser loaded directly from `file://`, without a development server.
- Screenshots visually inspected for all-states, colonies, completed labels, and compact layouts. Alaska extent and desktop map height corrected following inspection.
- macOS shell scripts pass `bash -n`; Info.plist parses successfully.
- No runtime npm dependencies. Geography and polygon-intersection library are included in the project.

## Not verified here

- Native Swift compilation, actual macOS WKWebView behavior, native UserDefaults across app launches, signing, and Finder launch require macOS. This Linux environment cannot produce or run the macOS executable. The included script performs compilation, bundle construction, ad-hoc signing, and signature verification on the target Mac.
- Linux WebKit test execution: browser installed, but required host libraries were missing; the environment did not permit the system dependency installation. Tests are included for a suitable host.
- Physical touch/stylus hardware and VoiceOver were not tested. Pointer Events, keyboard navigation, semantic controls, and reduced-motion handling are implemented.

Recommended first-Mac smoke check: build and launch; place one state and MD–DE; toggle sound and names; quit/reopen to verify settings; resize the window; complete a four-state Southwest puzzle; copy the app into Applications and open it there.
