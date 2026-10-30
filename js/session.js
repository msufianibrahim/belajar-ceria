// Play-time limit. Pure functions over the saved `session` object so they can be unit-tested.
//
// Only active play time counts. A natural break as long as the rest period also
// resets the clock. When time is up, the child finishes the current round, then rests.

const MIN = 60000;

export function addPlayTime(session, ms, now) {
  session.usedMs += ms;
  session.lastActive = now;
}

// True if the child must rest now. Starts a rest period when the limit is reached.
export function mustRest(session, settings, now) {
  const restMs = settings.restMinutes * MIN;
  if (session.restUntil > now) return true;
  if (session.restUntil) {
    session.restUntil = 0;
    session.usedMs = 0;
  }
  if (session.lastActive && now - session.lastActive >= restMs) session.usedMs = 0;
  if (session.usedMs >= settings.sessionMinutes * MIN) {
    session.restUntil = now + restMs;
    session.usedMs = 0;
    return true;
  }
  return false;
}

export function endRest(session) {
  session.restUntil = 0;
  session.usedMs = 0;
}
