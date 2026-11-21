// Limits wrong join-code and join-password guesses (#13, #14 decisions): 5 failures per 15 minutes
// per key (an IP address, and a user when signed in). In memory, so counts reset when the server restarts.
//
// Usage: call begin() before the first await and refund() once the attempt succeeds. Counting up front
// means requests sent at the same time can't all pass the check before any failure is recorded.
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map(); // key -> { count, resetAt }

function current(key, now) {
  const entry = failures.get(key);
  if (entry && entry.resetAt <= now) {
    failures.delete(key);
    return null;
  }
  return entry;
}

const blocked = (keys) => keys.some((key) => (current(key, Date.now())?.count || 0) >= LIMIT);

// Counts an attempt for every key. Returns false (and counts nothing) if any key is already at the limit.
function begin(keys) {
  if (blocked(keys)) return false;
  const now = Date.now();
  if (failures.size > 10000) for (const key of failures.keys()) current(key, now); // drop expired entries
  for (const key of keys) {
    const entry = current(key, now);
    if (entry) entry.count += 1;
    else failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }
  return true;
}

// Takes back an attempt counted by begin() once it has succeeded.
function refund(keys) {
  for (const key of keys) {
    const entry = failures.get(key);
    if (entry && entry.count > 0) entry.count -= 1;
  }
}

// For tests.
const reset = () => failures.clear();

module.exports = { blocked, begin, refund, reset, LIMIT };
