chrome.action.enable();

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed...");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Extension reloaded...");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);
  // Ensure that message is related to audio control
  if (message.action === "play" || message.action === "pause") {
    // Send the command to the content script of the active tab
    console.log("Attempting to send message.");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Sending message to tab:", tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }
});
