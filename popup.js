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
  console.log("Chrome Tab Query Attempting...");
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
  console.log("Main Attempeting...");
  const schemaJSON = createSchema();

  const tabsResult = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(tabs[0].title);
    });
  });

  console.log(tabsResult);

  const chatGPTResponse = await askChatGPT(
    `Recommend a song which relates to ${tabTitle.textContent}. Explain your rationale in pne sentence.`,
    schemaJSON
  );

  moodDesc.textContent = `${chatGPTResponse.trackChoice}`;
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

  const formDataObj = {};
  const formData = new FormData(form);
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  const schemaJSON = createSchema();

  console.log(formDataObj);

  if (formDataObj.filter == "genre" && formDataObj.input) {
    schemaJSON.properties.track.description = `You must provide a song in this genre ${formDataObj.input}. No exceptions`;
  } else if (formDataObj.filter == "artist" && formDataObj.input) {
    schemaJSON.properties.track.description = `You must provide a song by ${formDataObj.input}. No exceptions`;
  }

  const chatGPTResponse = await askChatGPT(
    `Recommend a song which relates to ${tabTitle.textContent}. Explain your rationale in one sentence.`,
    schemaJSON
  );

  moodDesc.textContent = `${chatGPTResponse.trackChoice}`;
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
              "You are a friendly and casual music assistant designed to output diverse song recommendations in JSON format",
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

function createChatSchema() {
  return {
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
      trackChoice: {
        type: "string",
        description:
          "Explanation for choosing this track in relation to the user's input",
      },
    },
    required: ["track", "artist", "album", "genre", "trackChoice"],
  };

  return schemaJSON;
}
