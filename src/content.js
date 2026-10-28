const intervalRateMs = 1000;

const cssClassName_Wrapper = `meetings-page-auto-closer-for-zoom-wrapper`;
const cssClassName_MainPopOver = `meetings-page-auto-closer-for-zoom-main-pop-over`;
const cssClassName_CountdownText = `meetings-page-auto-closer-for-zoom-countdown-text`;
const cssClassName_CloseNowBtn = `meetings-page-auto-closer-for-zoom-close-now-btn`;
const cssClassName_StopLink = `meetings-page-auto-closer-for-zoom-stop-link`;

const cssClassName_SettingsMenu = `meetings-page-auto-closer-for-zoom-settings-menu`;
const cssClassName_SettingsOption = `meetings-page-auto-closer-for-zoom-settings-option`;

const localStorageKey_CountdownStartTimeMs = `b9d55053-5a15-4b65-98ce-73711e1d83f9`;

function log(text) {
  console.log(`MPACFZ: ${text}`);
}

log('loaded...');

let timeTillCloseMs = getCountdownStartTimeMs();

function getCountdownStartTimeMs() {
  let rawValue = null;
  try {
    rawValue = localStorage.getItem(localStorageKey_CountdownStartTimeMs);
  } catch (e) {
    console.error(e);
  }
  const normalized = CloseRules.normalizeCountdownStartTimeMs(rawValue);
  if (normalized.reset) {
    setCountdownStartTimeMs(normalized.startTimeMs);
  }
  return normalized.startTimeMs;
}

function setCountdownStartTimeMs(startTimeMs) {
  localStorage.setItem(localStorageKey_CountdownStartTimeMs, startTimeMs);
}

function getWrapperEl() {
  return document.documentElement.querySelector(`.${cssClassName_Wrapper}`);
}

function countdownWithText(countdownTimeMs) {
  if (false) {//Used for freezing the countdown to debugging styling
    countdownTimeMs = getCountdownStartTimeMs();
    clearInterval(intervalId);
  }

  let wrapperEl = getWrapperEl();

  if (!wrapperEl) { // Lazy init the element
    wrapperEl = document.createElement('div');
    wrapperEl.classList.add(cssClassName_Wrapper);
    wrapperEl.innerHTML = `
    <div class='${cssClassName_MainPopOver}'>
      <div class='${cssClassName_CountdownText}'></div>
      <a class='${cssClassName_StopLink}'>cancel</a>
      <a class='${cssClassName_CloseNowBtn}'>close now</a>
    </div>
    `;
    document.body.appendChild(wrapperEl);

    wrapperEl.querySelector(`.${cssClassName_CloseNowBtn}`).onclick = () => {
      log('Closing tab now');
      closeThisTabNow();
    };

    wrapperEl.querySelector(`.${cssClassName_StopLink}`).onclick = () => {
      log('Canceled the countdown');
      clearInterval(intervalId);
      wrapperEl.remove();
    };

    injectAndUpdateSettingsMenu();
  }

  const countdownEl = wrapperEl.querySelector(`.${cssClassName_CountdownText}`);
  countdownEl.innerText = `Closing page in ${Math.round(countdownTimeMs / 1000)} seconds`;
}

function injectAndUpdateSettingsMenu() {
  const { currentSec, options: optionsList } = CloseRules.countdownSettings(getCountdownStartTimeMs());
  if (optionsList.length === 0) {
    log('no options');
    return;
  }
  const wrapperEl = getWrapperEl();
  wrapperEl.querySelector(`.${cssClassName_SettingsMenu}`)?.remove();

  const settingsEl = document.createElement('div');
  settingsEl.classList.add(cssClassName_SettingsMenu);
  settingsEl.innerHTML = `
  ${currentSec} seconds not your speed?  Try 
  <a class='${cssClassName_SettingsOption}'>${optionsList[0]}s</a>
  `;
  if (optionsList.length > 1) {
    settingsEl.innerHTML += `
    or
    <a class='${cssClassName_SettingsOption}'>${optionsList[1]}s</a>
    `;
  }
  const optionsElList = settingsEl.querySelectorAll(`.${cssClassName_SettingsOption}`);
  for (let i = 0; i < optionsElList.length; i++) {
    const optionEl = optionsElList[i];
    const op = optionsList[i];
    optionEl.onclick = () => {
      log(`New option selected: ${op}`);
      const ms = CloseRules.countdownMsForChoice(op);
      timeTillCloseMs = ms;
      setCountdownStartTimeMs(ms);
      injectAndUpdateSettingsMenu();
    };

  }
  wrapperEl.appendChild(settingsEl);
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
  return CloseRules.isMeetingStatusSuccess(window.location.href);
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

  closeThisTabNow();
}

function closeThisTabNow() {
  chrome.runtime.sendMessage({ pleaseCloseThisTab: true });
}

let intervalId = setInterval(countDownToClose, intervalRateMs);
