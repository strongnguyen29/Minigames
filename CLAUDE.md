# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Vương Quốc Vui Vẻ" is a Vietnamese learning-game PWA for kids (ages 5–8), hosted by the mascot Kuromi. It has math/geometry mini-games, a star economy (princess fashion shop, sound shop with songs/stories, Kuromi chat), a parent-rated chore tracker ("Công chúa chăm ngoan"), and optional Firebase cloud backup. It deploys as static files to GitHub Pages (`strongnguyen29.github.io/Minigames`). UI text, code comments, docs and test names are in Vietnamese; commit messages use English conventional commits (`feat:`, `fix:`, `test:`, `docs:`).

## Commands

```bash
npm test                                  # all unit tests (node:test, no browser)
node --test tests/radio.test.js           # one test file
node --test --test-name-pattern="spent" tests/merge.test.js   # one test by name
npm run e2e                               # Playwright smoke test on 3 viewports; needs Google Chrome installed; screenshots → tests/e2e/shots/
node -e "import('./tests/e2e/serve.mjs').then(m=>m.serve(8080).then(r=>console.log(r.url)))"  # serve the app locally (any static server works)
```

Voice pipeline (Kuromi's recorded lines, ElevenLabs; needs `.env`, see `.env.example`):
```bash
npm run voice:export      # js/lines.js → audio/voice/script.csv, script.md, voice-prompt.md
npm run voice:generate    # generate missing mp3s via ElevenLabs, then rewrite manifest (args: prefixes, --force, --dry)
npm run voice:manifest    # rescan audio/voice/*.mp3 → audio/voice/manifest.js (VOICE_FILES)
```

There is no build step, bundler, linter or framework.

## Architecture

**Plain global scripts, order matters.** `index.html` loads `js/*.js` as classic `<script>` tags that share one global scope (no modules, no imports). Later files call functions defined in earlier ones; optional dependencies are guarded with `typeof x!=='undefined'` / `typeof fn==='function'` so files can be loaded in subsets. When adding a file, insert it in the right place in `index.html` *and* in the `FILES` arrays of any tests that need it. `js/main.js` is the entry point (`cloud.init()` + splash → welcome/home).

**State.** A single global save object `S` (defined in `js/core.js`) persisted to `localStorage` key `be_vui_hoc_toan_v1`. `DEF`/`freshSave()` give defaults; `load()` migrates old shapes; every mutation ends with `save()`, which also schedules a cloud push. When adding a new field to `S`, update `DEF`, `freshSave()`, `load()` migration if needed, **and** `mergeSave` in `js/merge.js`.

**Multi-device merge (`js/merge.js`, `js/sync.js`).** Cloud sync (Firebase Auth Google + Firestore doc `users/{uid}/profiles/main`, SDK loaded dynamically from gstatic) is a backup; localStorage stays primary. `mergeSave` is network-independent and deterministic: counters (stars/rounds/perfect) are tracked per-device in `S.earned[deviceId]` and summed; `spent` is recomputed from `owned` via prices; sets are unioned; `best` takes per-key max; `LOCAL_ONLY` fields (sound settings, `listen`, `talk`) never leave the device. The balance shown to the user is derived: `balance()` in `js/shop.js` = stars − shop spent − `radioSpent()` − `talkSpent()`. Sync is disabled when `FIREBASE_CONFIG` is null (setup: `docs/firebase-setup.md`).

**Screens.** Each screen is a function that writes `app.innerHTML` using `screenHTML({mascot,top,body,cls})` + `topbar()` from `js/scene.js`; navigation goes through `go(fn)` / `goTap(el,fn)` in `js/ui.js`, which stops voice, radio, chat and parent mode before switching. Inline `onclick="..."` handlers call globals. `music.scene(cls)` mutes background music on certain screens.

**Games.** `GAMES` registry in `js/questions.js` (`{name,icon,levels,gen}`); `HOME_ORDER` in `js/ui.js` controls the home grid. Each generator returns `{prompt, visual, choices:[{html,key}], correct, key, say?, explain?}` rendered by one shared round loop (`start`/`finish` in `js/ui.js`). Original game rules (stars per mistakes, level unlocking, no-repeat keys) are in `docs/spec.md`; note the spec's "single inline index.html, no audio files" constraints are outdated.

**Voice (`js/voice.js`, `js/lines.js`).** Fixed lines live in `LINES` (ids like `home_1`, played via `mascotSay(group)`); question text is spoken by segmenting it into recorded `PHRASES` + `num_0..num_100` clips (played at `Q_FILE_RATE`), falling back to `speechSynthesis` (vi-VN) if any segment or file is missing. `VOICE_FILES` (from the generated `audio/voice/manifest.js`) says which mp3s exist. After adding/changing lines: export → generate → manifest. A single reused `Audio` element is required for iOS unlock.

**Sound shop (`js/radio.js`, see `docs/tiem-am-thanh.md`).** Catalog `RADIO` at the top of the file; item id = path without extension and is persisted in saves, so never rename released files. `audio/songs/` and `audio/stories/` are gitignored (copyright) and served from Cloudflare R2 via `AUDIO_CDN`; hosting must support HTTP Range.

**Kuromi chat (`js/chat.js`, `js/chat-ui.js`, `js/live.js`).** Gemini API (Live websocket with native audio in `live.js`); the user's Gemini key is stored in localStorage (`be_vui_gemini_key_v1`), not in the repo. Daily free question quota per device, extra questions bought with stars.

**Shop & chores.** `js/shop.js` holds the fashion catalog `SHOP` (images under `images/shop-items/fashion/`); `js/chores.js` (logic, `S.chore`) + `js/chores-ui.js` (screens, parent lock).

## Testing

Unit tests (`tests/*.test.js`) load real source files into a `vm` context with fake DOM/Audio/localStorage/speechSynthesis via `tests/helpers/load.js`: `loadGame(FILES, opts)` returns `{ctx, get(expr), run(code)}`; tests drive globals through `get`/`run`. Each test file declares its own `FILES` list in `index.html` order. The e2e smoke test (`tests/e2e/smoke.mjs`) seeds localStorage, stubs `js/firebase-config.js` to null (never touches real Firebase), runs with `reducedMotion: 'reduce'`, and checks for console errors, horizontal scroll, and covered buttons.

## Docs

Design specs and implementation plans per feature are in `docs/superpowers/specs/` and `docs/superpowers/plans/` (dated); read the relevant one before extending a feature.
