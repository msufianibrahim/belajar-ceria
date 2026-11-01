// The reward economy. Kept pure (no DOM) so it can be unit-tested.
//
// Principles:
// - Coins reward progress and improvement, not plain repetition. The one exception is
//   daily practice: a parent-chosen topic pays a fixed amount once a day (capped).
// - Every finished round counts toward practice medals (🥉🥈🥇): effort, not score, no coins.
// - Replaying an old level is always allowed and still counts toward mastery,
//   but only earns coins if the child beats their previous best.
// - Mastery = a near-perfect round (9/10; 5/5 on short rounds) on 3 *different days* (spaced practice). On add/subtract
//   levels those rounds must be typed on the number pad (recall, not recognition).
// - Rewards are predictable. No random drops.

export const COINS = { firstClear: 10, newBest: 5, mastery: 15, practice: 5 }; // practice: per round of the day's plan
export const PRACTICE_CHOICES = [2, 3, 5];   // daily practice length the parent can pick (rounds a day)
// Daily practice plan: rounds a day (parent setting) and the coins, paid once for finishing them.
export function practicePlan(state) {
  const n = state.settings?.practiceRounds;
  const rounds = PRACTICE_CHOICES.includes(n) ? n : PRACTICE_CHOICES[0];
  return { rounds, coins: rounds * COINS.practice };
}
export const MEDALS = ['🥉', '🥈', '🥇'];
export const MEDAL_ROUNDS = [10, 20, 30];  // rounds on a level for each medal
export const medalCount = (rounds = 0) => MEDAL_ROUNDS.filter((n) => rounds >= n).length;
export const MASTERY_DAYS = 3;
export const ROUND = 10;                                    // questions per round
export const passMark = (total) => Math.ceil(total * 0.8); // 8 of 10
export const masteryMark = (total) => total - Math.floor(total / 10); // 9 of 10: one slip allowed

// `typed`: answered on the number pad. On typed levels only typed rounds count toward mastery.
export function settleRound(state, level, score, total, today, { typed = false } = {}) {
  const rec = (state.levels[level.id] ??= { best: 0, of: ROUND, cleared: false, perfectDays: [], mastered: false });
  const res = {
    score,
    total,
    passed: score >= passMark(total),
    coins: 0,
    sticker: null,
    newBest: false,
    masteryProgress: 0,
    justMastered: false,
    needsTyping: false,
    medal: null,            // newly earned practice medal
    practice: null,         // { done, of, paid } when this was a daily-practice round
  };

  const before = medalCount(rec.rounds);
  rec.rounds = (rec.rounds ?? 0) + 1;
  if (medalCount(rec.rounds) > before) res.medal = MEDALS[medalCount(rec.rounds) - 1];

  if (state.settings?.practice?.includes(level.id)) {
    if (state.practiceDay?.date !== today) state.practiceDay = { date: today, rounds: 0, paid: false };
    const day = state.practiceDay;
    day.rounds++;
    const plan = practicePlan(state);
    const paid = day.rounds >= plan.rounds && !day.paid;
    if (paid) {
      day.paid = true;
      res.coins += plan.coins;
    }
    res.practice = { done: Math.min(day.rounds, plan.rounds), of: plan.rounds, paid, coins: plan.coins };
  }

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

  const countsForMastery = !level.typed || typed;
  const masteryRound = score >= masteryMark(total) && !rec.mastered;
  if (masteryRound && !countsForMastery) res.needsTyping = true;
  if (masteryRound && countsForMastery) {
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
