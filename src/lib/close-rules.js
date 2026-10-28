(function (root) {
  const MIN_COUNTDOWN_START_MS = 5 * 1000;
  const MAX_COUNTDOWN_START_MS = 35 * 1000;
  const DEFAULT_COUNTDOWN_START_MS = 21 * 1000;
  const COUNTDOWN_STEP_SEC = 5;

  function isMeetingStatusSuccess(href) {
    const url = new URL(href);
    if (url.searchParams.get('status')?.toLowerCase() === 'success') {
      return true;
    }
    const hashValue = url.hash.replace(/^#/, '').split(/[?&]/)[0].toLowerCase();
    return hashValue === 'success';
  }

  function normalizeCountdownStartTimeMs(rawValue) {
    const startTimeMs = Number(rawValue);
    if (!startTimeMs || startTimeMs < MIN_COUNTDOWN_START_MS || startTimeMs > MAX_COUNTDOWN_START_MS) {
      return { startTimeMs: DEFAULT_COUNTDOWN_START_MS, reset: true };
    }
    return { startTimeMs, reset: false };
  }

  function countdownSettings(currentMs) {
    const currentSec = Math.round(currentMs / 1000);
    const gridSec = Math.round(currentSec / COUNTDOWN_STEP_SEC) * COUNTDOWN_STEP_SEC;
    const options = [];
    const decrementSec = gridSec - COUNTDOWN_STEP_SEC;
    const incrementSec = gridSec + COUNTDOWN_STEP_SEC;
    if (decrementSec * 1000 >= MIN_COUNTDOWN_START_MS) {
      options.push(decrementSec);
    }
    if (incrementSec * 1000 < MAX_COUNTDOWN_START_MS) {
      options.push(incrementSec);
    }
    return { currentSec, options };
  }

  function countdownMsForChoice(seconds) {
    return seconds * 1000;
  }

  const api = {
    MIN_COUNTDOWN_START_MS,
    MAX_COUNTDOWN_START_MS,
    DEFAULT_COUNTDOWN_START_MS,
    isMeetingStatusSuccess,
    normalizeCountdownStartTimeMs,
    countdownSettings,
    countdownMsForChoice,
  };

  root.CloseRules = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
