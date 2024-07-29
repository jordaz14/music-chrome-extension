let audio = new Audio(chrome.runtime.getURL("free-song.mp3"));

const title = document.querySelector("title");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  if (message.action === "play") {
    console.log(audio);
    title.textContent = "injection worked!";
    audio.play();
  } else if (message.action === "pause") {
    console.log("pause was pressed");
    audio.pause();
  }
});
