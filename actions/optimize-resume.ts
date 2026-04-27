"use server";

import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from "@/types/ai";

interface OptimizationResult {
  success: boolean;
  optimizedBody?: string;
  coverLetter?: string;
  error?: string;
}

export async function optimizeResumeAction(
  resumeLatex: string,
  jobDescription: string,
  config: { key: string; model: GeminiModel },
  coverLetterTemplate?: string
): Promise<OptimizationResult> {
  try {
    if (!config.key) {
      throw new Error("Missing API Key");
    }

    // 1. Extract content inside \begin{document}...\end{document}
    const documentMatch = resumeLatex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    if (!documentMatch) {
      throw new Error("Could not find \\begin{document}...\\end{document} in the LaTeX source.");
    }
    const bodyContent = documentMatch[1].trim();

    // Extract CL body if template provided
    let clBody = "";
    if (coverLetterTemplate) {
      const clMatch = coverLetterTemplate.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      if (clMatch) clBody = clMatch[1].trim();
    }

    // 2. Construct Prompt
    const prompt = `
      You are an expert career coach and LaTeX specialist.
      I will provide you with a LaTeX resume body, a Job Description, and optionally a Cover Letter template.

      GOAL:
      1. Optimize specific sections of the Resume Body for this job.
      2. Draft a professional Cover Letter.

      STRICT RULES FOR RESUME OPTIMIZATION:
      - ONLY modify the content within the following sections:
        1. Summary (or equivalent profile section)
        2. Skills (or equivalent technical section)
        3. Education: ONLY the specific "Courses" or "Awards" sub-lists (keep the degree/university intact).
        4. Experience & Projects: ONLY the bullet points (the content inside \itemize or equivalents).
      - DO NOT touch: Names, Contact Info, Degree names, University names, Company names, Dates, or Job Titles.
      - Maintain the exact LaTeX structure, commands, and formatting perfectly.
      - Use measurable impacts and keywords from the job description.
      - Keep the output concise and professional.
      - SKILLS CONSTRAINT: Do NOT fabricate technical skills that are completely unrelated to the candidate's existing profile. You may infer highly related skills (e.g., adding FastAPI if they know Python), but do not add entirely new ecosystems (like Spring Boot or Docker) if the candidate has no background in it.
      - TONE: Write in a natural, human-sounding tone using normal English. Avoid overly corporate jargon, buzzword-stuffing, or robotic phrasing.
      - Return ONLY the updated LaTeX body content. Do NOT include the preamble or the \begin/\end document tags.

      RULES FOR COVER LETTER:
      ${coverLetterTemplate ? '- I have provided a Cover Letter template body. REWRITE the content inside while preserving the overall LaTeX structure and contact information.' : '- Draft a brief yet high-impact cover letter tailored to the JD. Return as plain text content.'}
      - Focus on solving the company's specific problems.
      - Do not write much, go through the resume and pick the best points and write them in the cover letter.
      - Do not repeat the same things.
      - DO NOT include any placeholder text like [Job Title], [Company Name], etc. Fill in everything with relevant information based on the JD and the resume.
      - TONE: Write in a natural, conversational, yet professional human voice. Do not sound like an AI.

      INPUTS:
      --- JOB DESCRIPTION ---
      ${jobDescription}

      --- RESUME BODY (LATEX) ---
      ${bodyContent}

      ${coverLetterTemplate ? `--- COVER LETTER TEMPLATE BODY (LATEX) ---\n${clBody}` : ''}

      RESPONSE FORMAT (Strict JSON):
      {
        "optimizedBody": "the updated latex resume body content here",
        "coverLetter": "the updated latex cover letter body content (if template provided) OR plain text (if no template)"
      }
    `;
    // 3. Initialize Gemini
    const genAI = new GoogleGenAI({ apiKey: config.key });
    const result = await genAI.models.generateContent({
      model: config.model,
      contents: prompt
    });

    const responseText = result.text;

    if (!responseText) {
      throw new Error("No response from AI.");
    }

    // Clean JSON response (Gemini sometimes adds markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returned an invalid response format.");
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      optimizedBody: data.optimizedBody,
      coverLetter: data.coverLetter,
    };

  } catch (error: any) {
    console.error("Optimization failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during optimization.",
    };
  }
}
