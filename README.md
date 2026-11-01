# Belajar Ceria

A learning game for a 5-year-old: Math, Bahasa Melayu, English, 华文, Iqra, Jawi and Asas Islam.
It's an installable web app (PWA) that runs offline on an Android tablet or iPad. There's no server, no account and no cost.

## Architecture

```
index.html            app shell
css/style.css         all styling (big touch targets, tablet-first)
js/app.js             screens, navigation, session time limit, parent area
js/rewards.js         reward economy (pure logic, unit-tested)
js/storage.js         save/load progress in the tablet's localStorage
js/audio.js           spoken prompts (built-in text-to-speech) + chimes
js/catalog.js         avatar shop items, real-world sticker tasks
js/subjects/*.js      one file per subject; each level = question generator
sw.js                 offline cache (service worker)
tests/                node unit tests
```

* **No backend.** All progress lives on the tablet. Use *Ibu Bapa → Simpan salinan* now and then to keep a backup file.
* **Hosting:** any static host. GitHub Pages and Cloudflare Pages are both free.

## Reward rules (js/rewards.js)

| Event | Coins |
|---|---|
| Pass a level for the first time (3/5) | 10 + a sticker |
| Beat your previous best score | 5 |
| Replay with the same or a lower score | 0 (still good practice) |
| Perfect score on 3 **different days** → 👑 Mahir | 15 |

* There are no random rewards, streaks or timers.
* Wrong answers say "Cuba lagi" and let the child try again. Only first-try answers count toward the score.
* **Placement:** the first time a subject is opened, it climbs levels while the child gets 2/2 right, then starts them at the level where they stopped. The child gets no right/wrong feedback during placement.
* **Time limit:** after 20 minutes of active play (configurable), the child finishes the current round and the avatar goes to sleep for 60 minutes. Parents can end the rest early.
* **Parent area** (⚙️, protected by a multiplication question): settings, progress, real-world stickers, backup and restore.

## Run locally

```sh
npm start              # or: python3 -m http.server 8000
open http://localhost:8000
npm test
```

## Testing

| Command | What it checks |
|---|---|
| `npm test` | Unit tests (`tests/`): reward rules, session limit, question generators. Takes under 1 s. |
| `npm run test:e2e` | Playwright (`e2e/`): real user flows on an Android-tablet Chromium and an iPad WebKit. Takes about 35 s. |
| `npm run test:all` | Both. GitHub Actions also runs both on every push. |

* **Write tests first for the logic** (rewards, session limit, new question generators). Write the failing test, then the code.
* **Use Playwright for flows.** Add a test when you add a screen or change how the child moves through the app.
* **Don't test the look.** Check it by eye and by watching your child play.
* The e2e tests open `/?test`, which exposes `window.__test.correctIndex()` so a test can always pick the right answer. That hook is off in normal use.

## Put it on the tablet (free)

1. Push this repo to GitHub.
2. In the repo, open **Settings → Pages → Deploy from branch → main / root**.
3. On the tablet, open `https://<username>.github.io/belajar-ceria/`.
   * **Android (Chrome):** use ⋮ → *Add to Home screen / Install app*.
   * **iPad (Safari):** use Share → *Add to Home Screen*. Always launch it from that icon. iPadOS can clear data for sites that are only visited in Safari.
4. The app works offline after the first load.

**When you deploy changes:** nothing extra. `sw.js` is network-first, so the tablet gets the new version on its next load. Bump `CACHE` in `sw.js` only when the `FILES` list changes.

**Voice:** prompts use the tablet's text-to-speech. For best results, install a Malay voice under the tablet's text-to-speech settings. If none is installed, the app falls back to an Indonesian voice.

## Adding a subject

1. Copy `js/subjects/math.js` to `js/subjects/<id>.js` and write the level generators. A question is `{ key, prompt, text?, visual, choices: [{label, value}], answer, wide? }`.
2. In `js/subjects/index.js`, replace the empty placeholder for that subject with the import.
3. Add the file to `FILES` in `sw.js`, then bump `CACHE`.
4. Never rename a level `id` once it's in use, because saved progress is keyed by it.

For Iqra and Jawi, record real audio (your own voice or your ustazah's) instead of using text-to-speech. Makhraj needs to be correct.
