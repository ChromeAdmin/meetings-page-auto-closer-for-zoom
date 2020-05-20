// Background script
const windowToLastActiveTabIdsMap = {}

function getLastActiveTabIdsListForWindowId(windowId) {
  if (!windowToLastActiveTabIdsMap[`wId-${windowId}`]) {
    windowToLastActiveTabIdsMap[`wId-${windowId}`] = [];
  }
  return windowToLastActiveTabIdsMap[`wId-${windowId}`];
}

function addTabToWindowMap(windowId, tabId) {
  const lastActiveTabIdsList = getLastActiveTabIdsListForWindowId(windowId);
  //Remove the tabId from the last active if it exists
  const index = lastActiveTabIdsList.indexOf(tabId);
  if (index > -1) {
    lastActiveTabIdsList.splice(index, 1);
  }
  //Insert the tabId at the end
  lastActiveTabIdsList.push(tabId);

  //If we've gone over our self-imposed size then delete the oldest added tabId
  if (lastActiveTabIdsList.length > 5) {
    lastActiveTabIdsList.shift();
  }
}

function focusTab(tabId) {
  const updateProperties = { active: true };
  chrome.tabs.update(tabId, updateProperties, (tab) => { });
}


chrome.tabs.onActivated.addListener((activeInfo) => {
  // console.log(`windowId: ${activeInfo.windowId} tabId:${activeInfo.tabId}`);
  addTabToWindowMap(activeInfo.windowId, activeInfo.tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.pleaseCloseThisTab) { return; }

  const windowId = sender.tab.windowId;
  const tabId = sender.tab.id;
  const lastActiveTabIdsList = getLastActiveTabIdsListForWindowId(windowId);
  if (lastActiveTabIdsList.length >= 2) { //There need to be at least 2 tabs in our window's history
    const lastActiveTabId = lastActiveTabIdsList[lastActiveTabIdsList.length - 1];
    const activeBeforeLastTabId = lastActiveTabIdsList[lastActiveTabIdsList.length - 2];
    if (tabId === lastActiveTabId) {
      // This is a case where the zoom tab we are about to close 
      // is the lastActiveTabId for this window. So we will change
      // the focus to the tab previously active in this window.
      focusTab(activeBeforeLastTabId);
      console.log('Recovered the active tab before zoom.');
    }
  }
  
  chrome.tabs.remove(tabId);
});

console.log(`zoom meetings page auto closer loaded.`)