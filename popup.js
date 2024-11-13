const tabTitle = document.querySelector("#title");
const songRec = document.querySelector("#song");
const songRecDesc = document.querySelector("#mood");
const spotifyButton = document.querySelector("#spotify-button");
const filterForm = document.querySelector("#filter-form");

// Find active tab on load and update tab title
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const activeTab = tabs[0];
  tabTitle.textContent = `${activeTab.title}`;
});

main();

async function main() {
  const schemaJSON = createChatSchema();

  const chatGPTResponse = await askChatGPT(
    `Recommend a song which relates to ${tabTitle.textContent}. Explain your rationale in one sentence.`,
    schemaJSON
  );

  songRecDesc.textContent = `${chatGPTResponse.trackChoice}`;
  songRec.textContent = `Recommendation: ${chatGPTResponse.track} by ${chatGPTResponse.artist}`;

  spotifyButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "authenticateSpotify",
      payload: chatGPTResponse,
    });
  });
}

filterForm.addEventListener("submit", handleFilterFormSubmit);
async function handleFilterFormSubmit(e) {
  e.preventDefault();

  // Gather filter form data
  const filterFormData = new FormData(filterForm);
  const filterFormDataObj = Object.fromEntries(filterFormData.entries());

  const chatSchema = createChatSchema();

  // Update schema passed to ChatGPT based on user filter data
  if (filterFormDataObj.filter == "genre" && filterFormDataObj.input) {
    chatSchema.properties.track.description = `You must provide a song in this genre ${filterFormDataObj.input}. No exceptions`;
  } else if (filterFormDataObj.filter == "artist" && filterFormDataObj.input) {
    chatSchema.properties.track.description = `You must provide a song by ${filterFormDataObj.input}. No exceptions`;
  }

  // Prompt ChatGPT for song recommendation given user filters
  try {
    const chatGPTResponse = await askChatGPT(
      `Recommend a song which relates to ${tabTitle.textContent}. Explain your rationale in one sentence.`,
      chatSchema
    );

    songRecDesc.textContent = `${chatGPTResponse.trackChoice}`;
    songRec.textContent = `Recommendation: ${chatGPTResponse.track} by ${chatGPTResponse.artist}`;

    spotifyButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        action: "authenticateSpotify",
        payload: chatGPTResponse,
      });
    });
  } catch (error) {
    console.error("Error occurred during ChatGPT Request:", error);
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
}
