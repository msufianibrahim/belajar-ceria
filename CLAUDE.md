# Belajar Ceria — notes for Claude

Read this first. It's the hand-over from earlier sessions: who it's for, what was agreed,
and how to work on it. README.md has the general architecture.

## Who and why
- Built by a dad (Malaysia, MYR) for his 5-year-old son, who is heading to SJKC.
  Son uses it on an Android tablet (also tested on iPad).
- Subjects: Maths, BM, English, 华文, Iqra, Jawi, Asas Islam. Built: **Maths**, **Iqra** (1, 3, 4–5 parts),
  **BM**, **English**, **华文**, **Jawi** (the last four ported from the JejakJaya curriculum,
  2026-11-15: listen / look / read-aloud levels; no speech recognition, no handwriting for letters).
  **Asas Islam** (js/subjects/islam.js, 2026-11-21, Malay, multiple choice).
- **Curriculum to age 12 (2026-11-21):** every subject now runs preschool → KSSR Tahun 1–6
  (Maths +41, BM +38, English +42, 华文 +33, Jawi +30, Asas Islam 36, Iqra +22 incl. rest of
  Iqra 1–2 and Iqra 6). Levels carry `year: N`; the level list shows Preschool / Year N headings
  (levels without `year` = preschool). Years must not go down (test). Sticker emoji are unique
  across all subjects (test); each subject has its own emoji family. Content was drafted by
  subagents and spot-checked, not yet checked by a teacher. Known doubts: zh maths terms
  (令吉/仙 etc.), Iqra 6 order from memory, BM/zh idiom paraphrases. Maths year levels are
  `probe: false` with `needs:` chains per strand; the number pad takes up to 7 digits.
- Free, no backend: vanilla-JS ES-module PWA, no build step, progress in localStorage
  (key `belajar-ceria-v1`). Repo github.com/msufianibrahim/belajar-ceria (public),
  live at https://msufianibrahim.github.io/belajar-ceria/ (GitHub Pages from `main`).

## How the user likes to work
- Replies: concise, no recaps, skip explanations unless asked. Mostly casual English, sometimes Malay.
- Commit messages: one short line, no body, **no Co-Authored-By or other attribution**.
- **Always deploy right after developing** — don't ask "deploy?". Procedure:
  1. `npm test` (node unit tests) and `npx playwright test` (e2e on android-tablet + ipad projects) — all must pass.
  2. Commit, bump `CACHE` in `sw.js` (`belajar-ceria-vN` → N+1), commit, `git push`.
  3. Poll `https://msufianibrahim.github.io/belajar-ceria/sw.js` until it shows the new version, then tell the user it's live.
- Show screenshots to yourself (Playwright, android-tablet project) when changing UI, before calling it done.
- He'll test on the tablet and report back; ask him to report misreads/bugs rather than guessing.

## Reward design (agreed — don't change without asking)
Healthy, predictable, effort-based. No random rewards, no streaks, session time limit + rest.
- Rounds are 10 questions. Pass 8/10, mastery mark 9/10. Stars always shown out of 5.
- Coins (js/rewards.js `COINS`): first clear 10 (+ sticker), beat your best 5, mastery 15
  (mastery = 9/10 on 3 different days; on number-pad levels those rounds must be typed).
  Replaying for the same score pays 0.
- Daily practice: parent picks 2/3/5 rounds; 5 coins per round, paid once a day for finishing,
  whatever the score (this is the agreed healthy "grind" mode — he asked for 30–50 questions
  with coins for all-correct; we rejected that as too long and fear-of-mistakes).
- Topics are **auto-picked** by default (`autoPractice` in progress.js: two furthest open,
  unmastered main-path Maths levels). **Practice first** (default on) greys out other levels of
  that subject until today's practice is done — because the son picks the easy levels.
- Practice medals 🥉🥈🥇 at 10/20/30 rounds of a level: effort, no coins, shown by the avatar.
- The son is coin-motivated: always show clearly what pays (coin tags on levels).
- Rounds save after every answer; quitting halfway shows a ▶️ Continue card (state.paused).

## Maths (js/subjects/math.js)
- English by default (he learns Maths in English at school); app language setting en/ms;
  华文 questions optional on mastered levels.
- **No dot pictures on add/subtract** — he counts the dots instead of adding.
- Number bonds confuse him: they never block progress. `needs:` on a level opens it once that
  level is passed (add5 → add10 → add9/add20, sub chains, column levels).
- Levels end with column (vertical) add/subtract, 2-digit, with/without carrying/borrowing.
  He **writes** the answer digits in tens/ones boxes; `js/digits.js` is an offline $P
  point-cloud recognizer with hand-made templates (~95% on synthetic tests; real 5yo writing
  unverified). Tapping the number under a box opens a fix pad to correct a misread; after a right
  answer his own writing is saved as templates (newest 5 per digit) so recognition learns his hand.
  The whole sum is a blue scribble layer
  (strike out digits, write carries) that is never read. Parent can switch to number pad.
- `probe: false` levels are skipped by the placement quiz (it must probe ≤ 10 levels).
- Level ids are stored in saved progress — never rename them.

## Iqra (js/subjects/iqra.js)
- Follows the book's order but uses own exercises (Iqra books are copyrighted): real Quran
  3-letter roots with marks changed (كَتَبَ → كَتِبُ), words get longer through a round
  (2 letters → 3 → two words), every word has the level's new mark plus earlier marks.
- **No sound.** Device Arabic TTS couldn't tell long from short vowels, and speech recognition
  drops harakat, so it can't check reading. The child reads aloud and a grown-up taps ✓ / ✗.
  (A Tarteel-style checker was discussed: not feasible for changed-mark words.)
- Built: Iqra 3 (8 levels), plus iqra1-fathah / fathah-alif, iqra4 tanwin & sukun, iqra5 shaddah
  (2026-11-15). Son was at dhammah terbalik. Still to fill in: the rest of **Iqra 1–2**. Book order — Iqra 1: letters a few at a time with fathah → other writing styles
  of standalone letters → telling similar-sounding letters apart. Iqra 2: joined letters →
  alif vs lam when joined → long aa → other joined styles → fathah berdiri → fathah berdiri +
  dotless ya. Font: bundled `fonts/noto-naskh.ttf` (small marks render properly).
- sound-test.html / sound-recheck.html are leftover TTS check pages (not linked from the app).

## Next up (user's wishlist)
1. **Reading companion mic test page**, inside this app for now: he reads a book page aloud
   (EN / BM / 华文); browser speech recognition follows along; a misread word turns orange
   (one more try), then red; **only red words can be tapped to hear** — so he can't just tap
   every word. Start with a small test page to check how well recognition hears his voice on
   the tablet. Caveats told to user: built for adult voices, needs internet, audio goes to
   Google/Apple. Later maybe OCR from a photo of the page.
   **Mic test page built (2026-11-15):** `mic-test.html` (not linked from the app), word matching
   in `js/follow.js` (tests/follow.test.js). User tried it in Edge: 14/18 English words; he sounds
   words out by syllables, so heard pieces may join into one word (up to 4); the best of up to 5
   recognizer guesses per phrase is used.
   **Companion v1 built (2026-11-15):** parent adds pages (title, language, text) in the parent
   area; home shows 📚 Read a book when pages exist; reading screen follows `companion()` rules
   in js/follow.js; js/listen.js wraps speech recognition (auto-restarts on Android pauses).
   `state.books`, `state.reads` (last red count). **No coins for reading** — user decided
   (2026-11-15): not for now. **Photo of the page** (js/ocr.js): Tesseract.js 5.1.1 from jsDelivr, on-device
   (msa / eng / chi_sim), fills the text box for the parent to check — user found typing too tedious.
   User found OCR unreliable (2026-11-21): now the parent picks a photo, then either
   "Send photo to AI app" (Web Share: photo + a question asking for the page's exact words, like
   his LaRas receipt sharing) or "Read photo on this tablet" (OCR). The AI's reply comes back by
   sharing it to Belajar Ceria (manifest `share_target`, GET ?text=, opens the parent gate, then the
   new-page box is filled; needs the app installed to the home screen) or by "Paste reply"
   (clipboard). Replies are tidied (markdown, links). Next: he tries it on the tablet.
2. Wished for by the content drafters: a "read the passage aloud" button, a decimal number pad,
   language-aware choice labels for Maths (months, shape names).

## Code map / gotchas
- js/app.js: all screens (string templates re-rendered via `render()`), actions via
  `data-act`, UI strings via `tr(en, ms)`; `N(v)` for `{en, ms}` data. Parent area behind a
  multiplication gate.
- js/progress.js: open levels (`frontier` per subject saved by id, `isOpen`, `needs`), migrations.
- js/storage.js: defaults deep-merged over saved data; add new settings there.
- js/avatar.js: full-body SVG avatar; shop items (js/catalog.js) are clothes/hat/extras/pet layers.
- sw.js: network-first offline cache; add new files to `FILES`; `cache: 'reload'` on install.
- e2e helper `open(page, seed)` turns Practice first and auto practice **off** unless a test
  sets them; `window.__test` (with `?test`) exposes answers for tests.
- `npm start` serves on :8000. Playwright config starts its own server (`tools/serve.py`: Python's
  stock http.server refuses connections on Windows under parallel tests).
