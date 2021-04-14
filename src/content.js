const intervalRateMs = 1000;
const maxCountdownStartTimeMs = 35 * 1000;
const minCountdownStartTimeMs = 5 * 1000;

const cssClassName_Wrapper = `zoom-meeting-page-auto-closer-wrapper`;
const cssClassName_MainPopOver = `zoom-meeting-page-auto-closer-main-pop-over`;
const cssClassName_CountdownText = `zoom-meeting-page-auto-closer-countdown-text`;
const cssClassName_CloseNowBtn = `zoom-meeting-page-auto-closer-close-now-btn`;
const cssClassName_StopLink = `zoom-meeting-page-auto-closer-stop-link`;

const cssClassName_SettingsMenu = `zoom-meeting-page-auto-closer-settings-menu`;
const cssClassName_SettingsOption = `zoom-meeting-page-auto-closer-settings-option`;

const localStorageKey_CountdownStartTimeMs = `b9d55053-5a15-4b65-98ce-73711e1d83f9`;

function log(text) {
  console.log(`ZMPAC: ${text}`);
}

log('loaded...');

let timeTillCloseMs = getCountdownStartTimeMs();

function getCountdownStartTimeMs() {
  const defaultStartTimeMs = 21 * 1000;
  let startTimeMs = defaultStartTimeMs;
  try {
    startTimeMs = Number(localStorage.getItem(localStorageKey_CountdownStartTimeMs));
  } catch (e) {
    console.error(e);
  }
  if (!startTimeMs || startTimeMs <= minCountdownStartTimeMs || startTimeMs > maxCountdownStartTimeMs) {
    setCountdownStartTimeMs(defaultStartTimeMs); // Overwrite to self-correct
    startTimeMs = defaultStartTimeMs;
  }
  return startTimeMs;
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
  const incrementalSec = 5.0;
  const trueCountdownStartTimeSec = Math.round(getCountdownStartTimeMs() / incrementalSec / 1000.0) * incrementalSec;

  const optionsList = [];
  const decrementValSec = trueCountdownStartTimeSec - incrementalSec;
  const incrementValSec = trueCountdownStartTimeSec + incrementalSec;
  if (decrementValSec * 1000 >= minCountdownStartTimeMs) {
    optionsList.push(decrementValSec);
  }
  if (incrementValSec * 1000 < maxCountdownStartTimeMs) {
    optionsList.push(incrementValSec);
  }
  if (!optionsList) {
    log('no options');
    return;
  }
  const wrapperEl = getWrapperEl();
  wrapperEl.querySelector(`.${cssClassName_SettingsMenu}`)?.remove();

  const settingsEl = document.createElement('div');
  settingsEl.classList.add(cssClassName_SettingsMenu);
  settingsEl.innerHTML = `
  ${trueCountdownStartTimeSec} seconds not your speed?  Try 
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
      const ms = (op + 1) * 1000;
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

  closeThisTabNow();
}

function closeThisTabNow() {
  chrome.runtime.sendMessage({ pleaseCloseThisTab: true });
}

let intervalId = setInterval(countDownToClose, intervalRateMs);
