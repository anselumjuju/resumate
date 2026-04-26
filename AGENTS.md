<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project Overview

This is a personal tool (not a SaaS product).

Purpose:

- Take a LaTeX resume
- Take a Job Description
- Use Gemini API to optimize resume sections
- Preview LaTeX as PDF
- Allow download of resume and cover letter

Focus:

- Reliability over features
- Clean UI
- Fast iteration

# Core Architecture Rules

- Use Next.js App Router
- Use ONLY Server Actions (no traditional API routes)
- Do NOT create /api routes
- Keep logic inside the /app directory when possible
- Prefer server components by default
- Use client components only when necessary

# Scope Constraints

- No authentication
- No database
- No analytics
- No external integrations except Gemini API
- Keep everything minimal and local-first

# UI / Design System

Design inspiration:

- Clean and minimal like Vercel

Rules:

- No heavy shadows
- No visual clutter
- Avoid over-styling
- Support both light and dark mode
- Use neutral color palette
- Focus on readability and spacing

Components:

- Must be reusable and composable
- Avoid tightly coupled UI logic
- Keep components small and focused

# Styling Rules

- Use Tailwind CSS only
- Use consistent spacing scale
- Avoid inline styles
- Use utility classes over custom CSS unless necessary

# Editor & Layout

- Use Monaco Editor for LaTeX editing
- Split layout:
  - Left: editor
  - Right: PDF preview
- Responsive:
  - Desktop → split
  - Mobile → stacked

# Performance Rules

- Debounce expensive operations (PDF compile, AI calls)
- Do NOT trigger compile on every keystroke
- Avoid unnecessary re-renders

# AI Integration Rules

- Do NOT allow AI to change LaTeX structure
- Only modify:
  - Summary
  - Skills
  - Projects
- Keep output concise and 1-page friendly
- Prefer measurable impact in bullet points

# Code Quality Rules

- Keep functions small and readable
- Avoid unnecessary abstractions
- Do not over-engineer
- Prefer clarity over cleverness

# Workflow Rules

- Build step by step
- Do NOT implement multiple features at once
- Wait for user confirmation before proceeding
- If unsure, ask for clarification instead of assuming

# Priority Rule

If any instruction conflicts with this file, follow AGENTS.md.
