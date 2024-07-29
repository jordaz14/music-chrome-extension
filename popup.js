const tabTitle = document.querySelector("#title");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];
  tabTitle.textContent = `${activeTab.title}`;
});

playButton.addEventListener("click", () => {
  console.log("Sending play command");
  chrome.runtime.sendMessage({ action: "play" });
});

pauseButton.addEventListener("click", () => {
  console.log("Sending pause command");
  chrome.runtime.sendMessage({ action: "pause" });
});

//CHATGPT API
API_URL = "https://api.openai.com/v1/chat/completions";
API_KEY = process.env

async function sendMessage(message) {
  const respone = await fetch(API_URL);
}
