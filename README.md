# StudyMate AI

A responsive B.Tech student study dashboard built with React + Vite (frontend) and Express (backend).

## Features
- Dashboard with study task progress
- AI Study Tools: summaries and multiple-choice quizzes from pasted notes
- Study schedule: add, complete, search and delete tasks
- Quiz center with answer checking and score
- Tasks saved in browser localStorage
- Optional OpenAI API integration; demo mode works without a key

## Requirements
- Node.js 18 or newer
- npm

## Run locally

1. Extract this folder and open it in VS Code.
2. Open a terminal in the `studymate-ai` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Optional AI setup:
   - Copy `.env.example` to `.env`
   - Put your API key in `OPENAI_API_KEY=...`
   - Keep `.env` private; do not upload it to GitHub.
   - Without a key, the website uses a simple demo fallback.

5. Start the backend API:

   ```bash
   npm start
   ```

6. In a second terminal, start the frontend:

   ```bash
   npm run dev
   ```

7. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

The frontend's `/api` requests need the Vite development proxy. Add this to `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' }
  }
})
```

## Production build

```bash
npm run build
npm start
```

Express serves the built `dist` frontend and API on the configured port.

## Important note
The no-key quiz generator is a demonstration, not a reliable assessment generator. For a college demo, use sample notes or configure the AI key on the backend.
