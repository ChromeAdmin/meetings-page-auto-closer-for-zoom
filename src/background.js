// Background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.pleaseCloseThisTab) chrome.tabs.remove(sender.tab.id);
});