const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isMeetingStatusSuccess,
  normalizeCountdownStartTimeMs,
  countdownSettings,
  countdownMsForChoice,
  DEFAULT_COUNTDOWN_START_MS,
} = require('../src/lib/close-rules.js');

test('a launched meeting is status=success or a #success hash', () => {
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1?status=success'), true);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1?status=Success'), true);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1#success'), true);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1#SUCCESS'), true);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1#success&extra'), true);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1?pwd=successstory'), false);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/successstory'), false);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1?status=successful'), false);
  assert.equal(isMeetingStatusSuccess('https://zoom.us/j/1#successful'), false);
});

test('countdown values stay inside 5 to 35 seconds', () => {
  assert.deepEqual(normalizeCountdownStartTimeMs(null), {
    startTimeMs: DEFAULT_COUNTDOWN_START_MS,
    reset: true,
  });
  assert.deepEqual(normalizeCountdownStartTimeMs('5000'), { startTimeMs: 5000, reset: false });
  assert.deepEqual(normalizeCountdownStartTimeMs('4999'), {
    startTimeMs: DEFAULT_COUNTDOWN_START_MS,
    reset: true,
  });
  assert.deepEqual(normalizeCountdownStartTimeMs('15000'), { startTimeMs: 15000, reset: false });
  assert.deepEqual(normalizeCountdownStartTimeMs('35000'), { startTimeMs: 35000, reset: false });
  assert.deepEqual(normalizeCountdownStartTimeMs('35001'), {
    startTimeMs: DEFAULT_COUNTDOWN_START_MS,
    reset: true,
  });
});

test('settings offer the neighboring 5 second steps and store the chosen seconds', () => {
  assert.deepEqual(countdownSettings(21000), { currentSec: 21, options: [15, 25] });
  assert.deepEqual(countdownSettings(15000), { currentSec: 15, options: [10, 20] });
  assert.deepEqual(countdownSettings(5000), { currentSec: 5, options: [10] });
  assert.equal(countdownMsForChoice(15), 15000);
});
