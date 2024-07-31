const tabTitle = document.querySelector("#title");
const moodDesc = document.querySelector("#mood");
const songRec = document.querySelector("#song");
const spotifyButton = document.querySelector("#spotify-button");
const openaiButton = document.querySelector("#openai-button");

/*
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
*/

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];
  tabTitle.textContent = `Tab: ${activeTab.title}`;
});

/*
playButton.addEventListener("click", () => {
  console.log("Sending play command");
  chrome.runtime.sendMessage({ action: "play" });
});

pauseButton.addEventListener("click", () => {
  console.log("Sending pause command");
  chrome.runtime.sendMessage({ action: "pause" });
});
*/

openaiButton.addEventListener("click", () => main());

//ChatGPT API

async function loadConfig() {
  try {
    const response = await fetch(chrome.runtime.getURL("config.json"));
    if (!response.ok)
      throw new Error(`Failed to load config: ${response.statusText}`);
    const config = await response.json();
    return config.API_KEY;
  } catch (error) {
    console.error("Error loading configuration:", error);
    return null;
  }
}

const schemaJSON = {
  type: "object",
  properties: {
    track: { type: "string", description: "Name of the song" },
    artist: {
      type: "string",
      description: "Name of the artist associated with the track",
    },
    album: {
      type: "string",
      description: "Name of the album associated with the track",
    },
    mood: { type: "string", description: "Mood of the tab title in one word" },
    rationale: {
      type: "string",
      description:
        "Justification for why ChatGPT recommended this song in one sentence",
    },
  },
  required: ["track", "artist"],
};

async function main() {
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = await loadConfig();

  async function promptChatGPT(message) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant designed to output music recommendations in JSON format",
            },
            { role: "user", content: message },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "musicRecsToJSON",
                description: "Music Recommendations in JSON Format",
                parameters: schemaJSON,
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "musicRecsToJSON" },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices[0].message.tool_calls[0].function.arguments;
      const jsonReply = JSON.parse(reply);
      console.log(jsonReply);
      return jsonReply;
    } catch (error) {}
  }

  const chatGPTResponse = await promptChatGPT(
    `Provide a song recommendation which encapsulates the mood of ${tabTitle.textContent}.`
  );

  moodDesc.textContent = `Mood: ${chatGPTResponse.mood}`;
  songRec.textContent = `Recommendation: ${chatGPTResponse.track} by ${chatGPTResponse.artist}`;

  spotifyButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "authenticateSpotify",
      payload: chatGPTResponse,
    });
  });
}

main();
