function log(text) {
  console.log(`ZMPAC: ${text}`);
}

log('loaded...');

let timeTillCloseMs = 21 * 1000;
const intervalRateMs = 1000;
const cssClassName_Wrapper = `zoom-meeting-page-auto-closer-wrapper`;
const cssClassName_CountdownText = `zoom-meeting-page-auto-closer-countdown-text`;
const cssClassName_StopLink = `zoom-meeting-page-auto-closer-stop-link`;

function countdownWithText(countdownTimeMs) {
  if (false) {//Used for freezing the countdown to debugging styling
    countdownTimeMs = 20 * 1000;
    clearInterval(intervalId);
  }

  let wrapperEl = document.documentElement.querySelector(`.${cssClassName_Wrapper}`);

  if (!wrapperEl) { // Lazy init the element
    wrapperEl = document.createElement('div');
    wrapperEl.classList.add(cssClassName_Wrapper);
    wrapperEl.innerHTML = `
    <div>
      <div class='${cssClassName_CountdownText}'></div>
      <a class='${cssClassName_StopLink}'>cancel</a>
    </div>
    `;
    document.body.appendChild(wrapperEl);

    let countdownEl = wrapperEl.querySelector(`.${cssClassName_StopLink}`);
    countdownEl.onclick = () => {
      log('Canceled the countdown');
      clearInterval(intervalId);
      wrapperEl.remove();
    };
  }

  const countdownEl = wrapperEl.querySelector(`.${cssClassName_CountdownText}`);
  countdownEl.innerText = `Closing page in ${Math.round(countdownTimeMs / 1000)} seconds`;
}

function getUrl() {
  return new URL(window.location.href);
}

function isWebClientLeave() {
  const url = getUrl();
  if (url.pathname && url.pathname.startsWith('/wc/leave')) {
    return true;
  } else {
    return false;
  }
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
  if (window.location.href.toLowerCase().includes('success')) {
    return true;
  }

  return false;
}

function isPageTextLikeMeetingLaunch() {
  const pageText = document?.body?.innerText?.toLowerCase() || '';
  if (pageText.includes('click open zoom.')) {
    return true;
  }
  if (pageText.includes('click launch meeting below')) {
    return true;
  }
  if (pageText.includes('having issues with zoom')) {
    return true;
  }
  if (pageText.includes('meeting has been launched')) {
    return true;
  }
  if (pageText.includes('having issues with zoom')) {
    return true;
  }
  return false;
}

function countDownToClose() {
  timeTillCloseMs -= intervalRateMs;
  log(`TimeMs left: ${timeTillCloseMs} isPageText=${isPageTextLikeMeetingLaunch()} isSuccess=${isMeetingStatusSuccess()} isPostAttendee=${isPostAttendee()} isWebClientLeave=${isWebClientLeave()}`);

  if (isPageTextLikeMeetingLaunch() || isMeetingStatusSuccess() || isPostAttendee() || isWebClientLeave()) {
    log(`All checks good to auto close`);
  } else {
    timeTillCloseMs += intervalRateMs; // Put back the time
    return;
  }

  countdownWithText(timeTillCloseMs);

  if (timeTillCloseMs > 0) { return; }

  clearInterval(intervalId);

  chrome.runtime.sendMessage({ pleaseCloseThisTab: true });
}

let intervalId = setInterval(countDownToClose, intervalRateMs);
