// The reward economy. Kept pure (no DOM) so it can be unit-tested.
//
// Principles:
// - Coins reward progress and improvement, never plain repetition.
// - Replaying an old level is always allowed and still counts toward mastery,
//   but only earns coins if the child beats their previous best.
// - Mastery = a perfect round on 3 *different days* (spaced practice).
// - Rewards are predictable. No random drops.

export const COINS = { firstClear: 10, newBest: 5, mastery: 15 };
export const MASTERY_DAYS = 3;
export const passMark = (total) => Math.ceil(total * 0.8); // 4 of 5

export function settleRound(state, level, score, total, today) {
  const rec = (state.levels[level.id] ??= { best: 0, cleared: false, perfectDays: [], mastered: false });
  const res = {
    score,
    total,
    passed: score >= passMark(total),
    coins: 0,
    sticker: null,
    newBest: false,
    masteryProgress: 0,
    justMastered: false,
  };

  if (res.passed && !rec.cleared) {
    rec.cleared = true;
    res.coins += COINS.firstClear;
    if (!state.stickers.includes(level.sticker.id)) {
      state.stickers.push(level.sticker.id);
      res.sticker = level.sticker;
    }
  } else if (score > rec.best) {
    res.coins += COINS.newBest;
    res.newBest = true;
  }
  rec.best = Math.max(rec.best, score);
  rec.lastPlayed = today;

  if (score === total && !rec.mastered) {
    if (!rec.perfectDays.includes(today)) rec.perfectDays.push(today);
    res.masteryProgress = rec.perfectDays.length;
    if (rec.perfectDays.length >= MASTERY_DAYS) {
      rec.mastered = true;
      res.justMastered = true;
      res.coins += COINS.mastery;
    }
  }

  state.coins += res.coins;
  return res;
}
