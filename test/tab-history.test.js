const test = require('node:test');
const assert = require('node:assert/strict');
const {
  addTabToHistory,
  tabToFocusBeforeClose,
  rememberActiveTab,
  closeRequestingTab,
} = require('../src/lib/tab-history.js');

function memoryStorage(initial = {}) {
  let map = structuredClone(initial);
  return {
    async read() {
      return structuredClone(map);
    },
    async write(next) {
      map = structuredClone(next);
    },
  };
}

function fakeTabs() {
  const calls = [];
  return {
    calls,
    async update(tabId, properties) {
      calls.push(['update', tabId, properties]);
    },
    async remove(tabId) {
      calls.push(['remove', tabId]);
    },
  };
}

test('tab history keeps the most recent tabs and moves repeats to the end', () => {
  let list = [];
  for (const tabId of [1, 2, 3, 2, 4, 5, 6]) {
    list = addTabToHistory(list, tabId);
  }
  assert.deepEqual(list, [3, 2, 4, 5, 6]);
});

test('focus goes to the previous tab only when the closing tab is current', () => {
  assert.equal(tabToFocusBeforeClose([10, 20], 20), 10);
  assert.equal(tabToFocusBeforeClose([10, 20], 10), null);
  assert.equal(tabToFocusBeforeClose([20], 20), null);
  assert.equal(tabToFocusBeforeClose(undefined, 20), null);
});

test('remembered tabs survive a fresh read of the same session storage', async () => {
  const storage = memoryStorage();
  await rememberActiveTab(storage, 1, 10);
  await rememberActiveTab(storage, 1, 20);
  await rememberActiveTab(storage, 2, 30);

  const tabs = fakeTabs();
  const result = await closeRequestingTab(tabs, storage, 1, 20);
  assert.deepEqual(result, { previousTabId: 10, focused: true });
  assert.deepEqual(tabs.calls, [
    ['update', 10, { active: true }],
    ['remove', 20],
  ]);

  const otherWindow = fakeTabs();
  const untouched = await closeRequestingTab(otherWindow, storage, 2, 99);
  assert.equal(untouched.previousTabId, null);
  assert.deepEqual(otherWindow.calls, [['remove', 99]]);
});

test('the zoom tab still closes when the previous tab is already gone', async () => {
  const storage = memoryStorage();
  await rememberActiveTab(storage, 1, 10);
  await rememberActiveTab(storage, 1, 20);
  const tabs = fakeTabs();
  tabs.update = async () => {
    throw new Error('no tab');
  };
  const result = await closeRequestingTab(tabs, storage, 1, 20);
  assert.deepEqual(result, { previousTabId: 10, focused: false });
  assert.deepEqual(tabs.calls, [['remove', 20]]);
});
