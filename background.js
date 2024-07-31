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
  const clientID = "d3cfbf644eb24125af43c2032ac41d10";
  const redirectURI = `https://${chrome.runtime.id}.chromiumapp.org/`;
  const scopes =
    "user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming";
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
      fetchUserProfile(accessToken);
      playSong(accessToken);

      //      chrome.storage.local.set({ spotifyAccessToken: accessToken });
    }
  );
}

async function fetchUserProfile(accessToken) {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const data = await response.json();
    console.log("User Profile:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function playSong(accessToken) {
  try {
    // Get available devices
    const devicesResponse = await fetch(
      "https://api.spotify.com/v1/me/player/devices",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!devicesResponse.ok) {
      throw new Error("Failed to fetch devices");
    }

    const devicesData = await devicesResponse.json();
    const device =
      devicesData.devices.find((d) => d.is_active) || devicesData.devices[0];

    if (!device) {
      throw new Error("No active device found");
    }

    // Start playback on the selected device
    const playResponse = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: ["spotify:track:0hFr6D7CnMR0obgvwb9jTV"],
        }),
      }
    );

    if (!playResponse.ok) {
      throw new Error("Failed to start playback");
    }

    console.log("Playback started");
  } catch (error) {
    console.error("Error:", error);
  }
}
