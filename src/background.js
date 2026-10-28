importScripts('lib/tab-history.js');

const TAB_HISTORY_STORAGE_KEY = 'windowToLastActiveTabIdsMap';

function sessionTabStorage() {
  return {
    async read() {
      const stored = await chrome.storage.session.get(TAB_HISTORY_STORAGE_KEY);
      return stored[TAB_HISTORY_STORAGE_KEY] || {};
    },
    async write(map) {
      await chrome.storage.session.set({ [TAB_HISTORY_STORAGE_KEY]: map });
    },
  };
}

const tabStorage = sessionTabStorage();
let chain = Promise.resolve();

function enqueue(task) {
  const run = chain.then(task);
  chain = run.then(() => undefined, (error) => {
    console.log(`MPACFZ: ${error}`);
  });
  return run;
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  return enqueue(() => TabHistory.rememberActiveTab(tabStorage, activeInfo.windowId, activeInfo.tabId));
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.pleaseCloseThisTab || !sender.tab) {
    return;
  }

  const windowId = sender.tab.windowId;
  const tabId = sender.tab.id;
  return enqueue(async () => {
    const result = await TabHistory.closeRequestingTab(chrome.tabs, tabStorage, windowId, tabId);
    if (result.focused) {
      console.log('MPACFZ: Recovered the active tab before zoom.');
    }
  });
});

console.log('MPACFZ: meetings-page-auto-closer-for-zoom loaded.');
