## 📊 API Documentation

### Streaming Endpoint

**GET** `/api/stream`

Returns Server-Sent Events (SSE) stream with content enhancement suggestions.

**Response Format:**
```json
{
  "status": "streaming | complete",
  "token": "Current text chunk",
  "text": "Accumulated text so far"
}
```

**Edit Card Format:**
```json
{
  "status": "streaming",
  "token": "<edit_card>\ncardid:unique-id\nold_text:Original content\nnew_text:Enhanced content\n</edit_card>",
  "text": "Full response with embedded cards"
}
```

### Health Check

**GET** `/health`

Returns server status and timestamp.

### API Info

**GET** `/api/info`

Returns API information and available endpoints.

## 🎨 Customization

### Styling

The interface uses Tailwind CSS for styling. Key design elements:

- **Glassmorphism**: `bg-black/40 backdrop-blur-sm`
- **Gradients**: `bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800`
- **Animations**: CSS transforms and transitions
- **Typography**: Inter font with custom sizing

### Color Scheme

```css
/* Primary Colors */
--primary-bg: rgba(0, 0, 0, 0.4)
--accent-blue: #3b82f6
--accent-green: #10b981
--accent-red: #ef4444
--text-primary: #d9d9d9
--text-secondary: #9ca3af
```

### Adding New Card Types

1. **Define the card structure** in `parseEditCards()`:
```typescript
interface CustomCard {
  cardId: string;
  type: 'title' | 'demo' | 'custom';
  oldContent: string;
  newContent: string;
}
```

2. **Update the regex pattern** for parsing:
```typescript
const customCardRegex = /<custom_card>\s*cardid:([^\n]+)\s*type:([^\n]+)\s*old_content:([^\n]+)\s*new_content:([^\n]+)\s*<\/custom_card>/g;
```

3. **Modify the UI rendering** in the component.

## 🧪 Testing

### Running Tests

```bash
# Frontend tests
npm test

# Backend tests
cd server
npm test
```

### Manual Testing

1. **Start both servers**
2. **Open browser developer tools**
3. **Monitor Network tab** for SSE connections
4. **Test streaming** by sending messages
5. **Verify card interactions** work correctly

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. **Build the project:**
```bash
npm run build
```

2. **Deploy the `dist` folder** to your hosting platform

3. **Update environment variables** for production API URL

### Backend (Railway/Heroku)

1. **Deploy the server folder** to your hosting platform

2. **Set environment variables:**
```env
PORT=3001
NODE_ENV=production
```

3. **Update CORS settings** for production domains

### Docker Deployment

**Dockerfile for frontend:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

**Dockerfile for backend:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔄 API Integration

### Connecting to Real AI APIs

Replace the mock server with real AI service:

```typescript
// Example integration with OpenAI# 🚀 Streaming AI Chat Interface

A modern, real-time streaming chat interface built with React, TypeScript, and Tailwind CSS. Features progressive text streaming, interactive content enhancement cards, and a sleek glassmorphism design.

![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3+-blue)

## ✨ Features

- **Real-time Streaming**: Progressive text streaming with 100ms intervals
- **Interactive Cards**: Accept/reject content enhancement suggestions
- **Modern UI**: Glassmorphism design with smooth animations
- **TypeScript Support**: Full type safety and IntelliSense
- **Responsive Design**: Works perfectly on all screen sizes
- **Server-Sent Events**: Efficient real-time communication

## 🎬 Demo

The interface demonstrates an AI content enhancement workflow:

1. **User Input**: Ask for content improvements
2. **Streaming Response**: Watch AI suggestions appear in real-time
3. **Interactive Cards**: Review and approve/reject specific changes
4. **Live Updates**: See changes applied instantly

## 🛠 Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Icons** for UI elements
- **Vite** for fast development

### Backend
- **Node.js** with Express
- **ES Modules** for modern JavaScript
- **Server-Sent Events** for streaming
- **CORS** enabled for cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/streaming-ai-chat-interface.git
cd streaming-ai-chat-interface
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
cd ..
```

4. **Start the development servers**

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

## 📁 Project Structure

```
streaming-ai-chat-interface/
├── README.md
├── package.json
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── components/
│   │   └── ChatBox.tsx       # Main chat interface
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── server/
│   ├── server.js             # Express server with SSE
│   └── package.json          # Server dependencies
└── .gitignore
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
```

### Customizing Stream Data

Edit `server/server.js` to modify the mock streaming responses:

```javascript
const mockDataSets = [
    { "status": "streaming", "token": "Your custom content", "text": "[]Your custom content" },
    // Add more streaming chunks...
];
```

## 📊