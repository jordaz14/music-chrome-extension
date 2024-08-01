const tabTitle = document.querySelector("#title");
const moodDesc = document.querySelector("#mood");
const songRec = document.querySelector("#song");
const spotifyButton = document.querySelector("#spotify-button");
const openaiButton = document.querySelector("#openai-button");
const form = document.querySelector("#filter-form");

/*
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
*/

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];
  tabTitle.textContent = `${activeTab.title}`;
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

//ChatGPT API

main();

async function main() {
  const schemaJSON = createSchema();

  const chatGPTResponse = await askChatGPT(
    `Provide a song recommendation which captures the mood of ${tabTitle.textContent}.`,
    schemaJSON
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

form.addEventListener("submit", handleFormSubmit);

async function handleFormSubmit(e) {
  e.preventDefault();
  console.log("Form Submitted");

  const formDataObj = {};
  const formData = new FormData(form);
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  const schemaJSON = createSchema();

  formDataObj.genre
    ? (schemaJSON.properties.track.description = `You must provide a song in this genre ${formDataObj.genre}. No exceptions`)
    : console.log("No genre entry");

  formDataObj.artist
    ? (schemaJSON.properties.track.description = `You must provide a song by ${formDataObj.artist}. No exceptions`)
    : console.log("No artist entry");

  const chatGPTResponse = await askChatGPT(
    `Provide a song recommendation which captures the mood of ${tabTitle.textContent}.`,
    schemaJSON
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

async function askChatGPT(message, schema) {
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = await loadConfig();

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
              "You are a helpful assistant designed to output diverse song recommendations in JSON format",
          },
          { role: "user", content: message },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "musicRecsToJSON",
              description: "Music Recommendations in JSON Format",
              parameters: schema,
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

function createSchema() {
  let schemaJSON = {
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
      genre: {
        type: "string",
        description: "Music genre associated with the track",
      },
      mood: {
        type: "string",
        description: "Mood of the tab title in one word",
      },
      rationale: {
        type: "string",
        description:
          "Justification for why ChatGPT recommended this song in one sentence",
      },
    },
    required: ["track", "artist", "album", "genre", "mood", "rationale"],
  };

  return schemaJSON;
}
