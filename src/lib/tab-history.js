(function (root) {
  const TAB_HISTORY_LIMIT = 5;

  function windowHistoryKey(windowId) {
    return `wId-${windowId}`;
  }

  function addTabToHistory(list, tabId, limit = TAB_HISTORY_LIMIT) {
    const next = Array.isArray(list) ? list.filter((id) => id !== tabId) : [];
    next.push(tabId);
    if (next.length > limit) {
      return next.slice(next.length - limit);
    }
    return next;
  }

  function tabToFocusBeforeClose(list, closingTabId) {
    if (!Array.isArray(list) || list.length < 2) {
      return null;
    }
    if (list[list.length - 1] !== closingTabId) {
      return null;
    }
    return list[list.length - 2];
  }

  async function rememberActiveTab(storage, windowId, tabId) {
    const map = await storage.read();
    const key = windowHistoryKey(windowId);
    map[key] = addTabToHistory(map[key], tabId);
    await storage.write(map);
  }

  async function previousTabForClose(storage, windowId, closingTabId) {
    const map = await storage.read();
    return tabToFocusBeforeClose(map[windowHistoryKey(windowId)], closingTabId);
  }

  async function closeRequestingTab(tabs, storage, windowId, tabId) {
    const previousTabId = await previousTabForClose(storage, windowId, tabId);
    let focused = false;
    if (previousTabId != null) {
      try {
        await tabs.update(previousTabId, { active: true });
        focused = true;
      } catch {
        focused = false;
      }
    }
    await tabs.remove(tabId);
    return { previousTabId, focused };
  }

  const api = {
    TAB_HISTORY_LIMIT,
    windowHistoryKey,
    addTabToHistory,
    tabToFocusBeforeClose,
    rememberActiveTab,
    previousTabForClose,
    closeRequestingTab,
  };

  root.TabHistory = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
