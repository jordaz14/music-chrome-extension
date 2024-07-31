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

  if (message.action === "authenticateSpotify") {
    authenticateSpotify();
  }
});

// Spotify API

function authenticateSpotify() {
  const clientID = "";
  const redirectURI = `https://${chrome.runtime.id}.chromiumapp.org/`;
  const scopes = "user-read-private user-read-email";
  const authURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&redirect_uri=${encodeURIComponent(
    redirectURI
  )}&scope=${encodeURIComponent(scopes)}`;

  chrome.identity.launchWebAuthFlow(
    {
      url: authURL,
      interactive: true,
    },
    (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error(
          chrome.runtime.lastError || "Error during authentication"
        );
        return;
      }

      const accessToken = new URL(redirectUrl).hash.match(
        /access_token=([^&]*)/
      )[1];
      console.log("Access Token:", accessToken);

      chrome.storage.local.set({ spotifyAccessToken: accessToken });
    }
  );
}
