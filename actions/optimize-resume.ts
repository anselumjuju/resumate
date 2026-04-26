"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
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

    // 2. Initialize Gemini
    const genAI = new GoogleGenerativeAI(config.key);
    const model = genAI.getGenerativeModel({ model: config.model });

    // 3. Construct Prompt
    const prompt = `
You are an expert career coach and LaTeX specialist.
I will provide you with a LaTeX resume body, a Job Description, and optionally a Cover Letter template.

GOAL:
1. Optimize the Resume Body for this specific job.
2. Draft a professional Cover Letter.

RULES FOR RESUME OPTIMIZATION:
- Modify ONLY the "Summary", "Skills", and "Projects" sections (or their equivalents).
- Maintain all other sections (Experience, Education, etc.) exactly as they are.
- Keep the LaTeX structure, commands, and formatting (e.g., \\section, \\textbf, \\itemize) perfectly intact.
- Use measurable impacts and keywords from the job description.
- Return ONLY the updated LaTeX body content. Do NOT include the preamble or the \\begin/\\end document tags.

RULES FOR COVER LETTER:
${coverLetterTemplate ? 
  '- I have provided a Cover Letter template body. REWRITE the content inside while preserving the overall LaTeX structure, contact information, and styling.' : 
  '- Draft a concise, high-impact cover letter tailored to the job description and the candidate\'s profile. Return as plain text content (I will wrap it in LaTeX later).'}
- Focus on how the candidate's skills solve the company's specific problems mentioned in the JD.

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

    // 4. Call Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
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
