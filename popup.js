const tabTitle = document.querySelector("#title");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const songRec = document.querySelector("#song");

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

async function main() {
  const API_URL = "https://api.openai.com/v1/chat/completions";
  const API_KEY = await loadConfig();
  console.log(API_URL, API_KEY);

  async function promptChatGPT(message) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Use the desired model
          messages: [{ role: "user", content: message }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;
      return reply;
    } catch (error) {}
  }

  const chatGPTResponse = await promptChatGPT(
    `Provide a song recommendation which encapsulates the mood of ${tabTitle.textContent}. Strictly follow the response format of: 
    song name, artist.`
  );

  console.log(chatGPTResponse);
  songRec.textContent = `${chatGPTResponse}`;
}

main();
