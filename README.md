# Resumate

Resumate is a local-first, AI-powered LaTeX resume and cover letter optimization tool. It allows you to maintain a master LaTeX resume template and instantly tailor it to specific job descriptions using Google's Gemini AI, complete with live PDF previews and unified diff resolutions.

## Features

- **Master Template Editor:** Maintain your base LaTeX resume and cover letter with real-time PDF compilation.
- **AI Job Transformer:** Paste a job description, and the AI will surgically optimize your summary, skills, and bullet points without breaking your LaTeX structure.
- **Live Diff Resolution:** A GitHub-style unified review pane to accept or discard AI suggestions line-by-line.
- **Local-First Design:** All your drafts, templates, and job histories are securely stored in your local browser storage.
- **Multiple Gemini Models:** Built-in rotation and rate-limit handling for Gemini 2.5 Flash, Pro, and Flash Lite.

## Tech Stack

- Next.js (App Router)
- React & TypeScript
- Tailwind CSS
- Monaco Editor (with custom LaTeX syntax highlighting)
- Google Gemini SDK

## Getting Started

1. Clone the repository and install dependencies:

   ```bash
   pnpm install
   ```

2. Run the development server:

   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Add your Gemini API Key in the settings panel to enable AI transformations.
