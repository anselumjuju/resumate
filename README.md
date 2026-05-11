# Resumate

Resumate is an AI-powered LaTeX resume and cover letter optimization tool that helps tailor applications based on specific job descriptions using Google's Gemini AI.

It allows users to maintain master LaTeX templates and rewrite selected sections without breaking the existing LaTeX structure.

## Features

- Edit and manage LaTeX resume templates
- AI-powered resume optimization using Gemini
- AI-generated cover letters based on job descriptions
- Job Description based rewriting
- Unified diff viewer to review AI changes
- Live PDF preview
- Local-first storage using browser localStorage
- Support for multiple Gemini models

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Monaco Editor
- Google Gemini SDK
- LaTeX

## MiKTeX Setup

Resumate requires MiKTeX to compile LaTeX resumes and cover letters into PDFs.

Download and install MiKTeX:

https://miktex.org/download

During installation, make sure MiKTeX is added to your system PATH.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open:

```txt
http://localhost:3000
```

## Gemini API Key

Add your Gemini API key in the settings panel to enable AI transformations.

The API key is stored locally in the browser and is never sent to any external backend server.

## Workflow

1. Create or edit your LaTeX resume template
2. Paste a Job Description
3. Let Gemini optimize your resume content
4. Generate a matching cover letter
5. Review changes in the diff viewer
6. Export the final PDF
