function log(text) {
  console.log(`ZMPAC: ${text}`);
}

log('loaded...');

let timeTillCloseMs = 31000;
const intervalRateMs = 1000;
const cssClassName = `zoom-meeting-page-auto-closer`;

function updateDivWithText(text) {
  let div = document.documentElement.querySelector(`.${cssClassName}`);
  if (!div) {
    div = document.createElement('div');
    div.classList.add(cssClassName);
    document.body.appendChild(div);
    div.onclick = () => {
      log('Canceled the autoclose');
      clearInterval(intervalId);
      div.remove();
    };
  }
  div.innerText = text;
}

function getUrl() {
  return new URL(window.location.href);
}

function isPostAttendee() {
  const url = getUrl();
  if (url.pathname && url.pathname.startsWith('/postattendee')) {
    return true;
  } else {
    return false;
  }
}

function isMeetingStatusSuccess() {
  const url = getUrl();
  let qpStatus = url.searchParams.get('status');
  if (qpStatus === 'success') {
    return true;
  } else {
    return false;
  }
}

function countDownToClose() {
  timeTillCloseMs -= intervalRateMs;
  log(`TimeMs left: ${timeTillCloseMs} isSuccess=${isMeetingStatusSuccess()} isPostAttendee=${isPostAttendee()}`);

  if (!isMeetingStatusSuccess() && !isPostAttendee()) { return; }

  updateDivWithText(`Closing page in ${Math.round(timeTillCloseMs / 1000)} seconds\n(click to cancel)`);

  if (timeTillCloseMs > 0) { return; }

  clearInterval(intervalId);

  chrome.runtime.sendMessage({pleaseCloseThisTab: true});
}

let intervalId = setInterval(countDownToClose, intervalRateMs);