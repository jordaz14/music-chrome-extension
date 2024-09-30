# Tab Tunes 🎵
<a href='http://www.recurse.com' title='Made with love at the Recurse Center'><img src='https://cloud.githubusercontent.com/assets/2883345/11325206/336ea5f4-9150-11e5-9e90-d86ad31993d8.png' height='20px'/></a>
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)

Tab Tunes is a chrome extension using ChatGPT and Spotify APIs that reads your webpage to play topical music in your Spotify app as you browse.

<hr>

## Table of Contents
- [Introduction](#tab-tunes-)
- [Core Technologies](#core-technologies)
- [Installation](#installation)
- [How to Use](#how-to-use)
- [Codebase Overview](#codebase-overview)
- [Technical Features](#technical-features)
- [Future Improvements](#future-improvements)
- [License](#license)

## Core Technologies

- JavaScript - _handle background logic and user interactivity within popup element_
- HTML/CSS - _structure and stylize extension's popup element_
- Chrome APIs - _query active web page title and launch auth flow_
- Spotify API - _identify playback device, locate song via recommendation, and play song in-app_
- OpenAI API - _prompt chatgpt to provide a song recommendation in JSON format based off webpage title_
- OAuth2 - _authenticate Spotify account to access playback device_

## Installation

Although not avaiable on the Chrome Web Store, local installation and usage of this chrome extension is easy via chrome://extensions/ in your chrome browser.

Before installing, you will need both a Spotify (Premium) and OpenAI account; additionally you'll want to create an OpenAPI key for your own project [here](https://platform.openai.com/api-keys) and set up a developer project within Spotify's platform [here](https://developer.spotify.com/dashboard).

Below are the steps to install and use this extension:

**1. Clone the respository to your IDE:**
```
git clone https://github.com/jordaz14/music-chrome-extension.git
```
**2. Navigate to the Project Directory:**
```
cd music-chrome-extension
```
**3. Create a config.json file with your OpenAPI Key in the following format:**
```
{ "API_KEY": "<openai_api_key>" }
```
**4. Update `clientID` in the `authenticateSpotify()` function of background.js with your own Spotify Client ID:**
```
function authenticateSpotify(GPTPayload) {
  const clientID = "<spotify_client_id>";
...}
```
**5. Load unpacked project (i.e. music-chrome-extension) in chrome://extensions/ and copy Chrome Extension ID to clipboard**

**6. Update the Redirect URI of your Spotify Developer Project in the following format:**
```
https://<chrome-extension-id>.chromiumapp.org/
```
**7. Manage Chrome Extensions and pin Tab Tunes. Ready to Use.**

## How to Use

**Authenticate Your Spotify Account**

https://github.com/user-attachments/assets/df5ea629-daa2-4f06-ba4c-ee49216ea6bc

**Get Song Recommendation**

https://github.com/user-attachments/assets/770757ef-8e5d-4277-91f4-137083fad045

**Filter Song Recommendation**

https://github.com/user-attachments/assets/f3b0c5bb-4803-48ff-a95f-2b24ad174962

**Play Song Recommendation**

https://github.com/user-attachments/assets/d3fab5a9-06b7-446a-a907-c1a7ae3e01d2

## Codebase Overview

Chrome extensions are typically made up of 3 files: background.js (global tasks and state management), content.js (interactions with web page's DOM), and popup.js (logic of extension popup). Given that we're playing the audio from the user's Spotify App (and not injecting audio content into the web page), our project does not have a content.js file.

[popup.js](./popup.js) - query for active page title, call OpenAI API for song recommendations, create JSON schema, and handle filter form submissions

[background.js](./background.js) - receive actions from popup.js, authenticate spotify account, identify playback device, and play song in-app

## Technical Features

- **3rd-Party API Integration**

- **OAuth2 Implict Control Flow**

- **Chrome APIs**

## Future Improvements
- [ ] Implement autoplay once a recommended song concludes
- [ ] Add a UI element to display the song currently playing in-app
- [ ] Add user controls to play, pause, and skip songs in extension
- [ ] Deploy extension to chrome marketplace

## License
This project is licensed under the GNU General Public License (GPL) - see the [LICENSE](./LICENSE) file for details.
