let timeoutInput = document.getElementById("timeout");
let button = document.getElementById("saveButton");

chrome.storage.sync.get("timeout", (data) => {
  timeoutInput.value = data.timeout || 20;
});

timeoutInput.addEventListener("keypress", (e) => {
  e.preventDefault();
});

button.addEventListener("click", () => {
  let timeout = parseInt(timeoutInput.value);
  chrome.storage.sync.set({ timeout: timeout }, () => {
    console.log("Timeout is: " + timeout);
  });
});
