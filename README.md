# ChatBox React

**ChatBox-React** is an interactive chat interface built with React and a Node.js backend. It simulates an AI chat experience by streaming mock messages using Server-Sent Events (SSE). The app also includes voice input, speech output, theme toggling, and content editing features — ideal for prototyping conversational UIs.

## Purpose

This project is a prototype environment to simulate real-time AI-like conversations, content revision workflows, and UI behavior without relying on a real AI backend. It helps developers or content teams test the frontend logic for chat interfaces before integrating with live AI APIs like OpenAI, Anthropic, or custom models.

## Features

- Mock real-time message streaming using `EventSource`
- Editable assistant messages with approve/reject logic
- Voice-to-text support (simulated)
- Text-to-speech responses via Web Speech API
- Dark and light mode toggle
- Auto-scroll and scroll-to-top behavior
- Chat reactions (like/dislike)
- Export and copy chat history
- Content suggestions with one-click prompts
- Persona-based assistant configuration

## Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS
- **Backend:** Node.js (Express), SSE
- **Browser APIs:** Web Audio API, Web Speech API

## Setup Instructions

### 1. Clone the Repository

```
git clone https://github.com/Kanchi11/ChatBox-React.git
cd ChatBox-React

### 2. Install Frontend Dependencies
  npm install
### 3. Start the Backend Server
  cd server
  node server.js
  This starts a local server that streams mock chat data at http://localhost:3001/api/stream.

4. Start the React App

  npm run dev
  Opens at http://localhost:3000.


Notes
This project does not use a real AI model. All responses are streamed from pre-written data in the backend.

Speech recognition is simulated using the browser’s SpeechRecognition (not server-side).

