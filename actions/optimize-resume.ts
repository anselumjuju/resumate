"use server";

import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from "@/types/ai";
import { CandidateProfile } from "@/types/profile";
import { formatCandidateProfileForPrompt, getGuardrailsPrompt, analyzeSkillMatch } from "@/lib/guardrails";

export interface AnalysisResult {
  success: boolean;
  matchingSkills: string[];
  missingSkills: string[];
  safeInferredSkills: { source: string; implied: string; reason?: string }[];
  unsupportedSkills: string[];
  summary?: string;
  error?: string;
}

export interface OptimizationResult {
  success: boolean;
  optimizedBody?: string;
  coverLetter?: string;
  error?: string;
}

/**
 * Pre-optimization AI Analysis: Compares Candidate Profile + Resume against Job Description
 */
export async function analyzeJobAlignmentAction(
  resumeLatex: string,
  jobDescription: string,
  config: { key: string; model: GeminiModel },
  profile?: CandidateProfile
): Promise<AnalysisResult> {
  try {
    if (!config.key) {
      throw new Error("Missing API Key");
    }

    const documentMatch = resumeLatex.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    const bodyContent = documentMatch ? documentMatch[1].trim() : resumeLatex;

    const candidateProfileText = formatCandidateProfileForPrompt(profile);
    const guardrailsText = getGuardrailsPrompt();

    const prompt = `
      You are an expert career auditor and technical skill evaluator.
      I will provide you with:
      1. Candidate Profile (Verified Ground Truth)
      2. LaTeX Resume Body (Existing Primary Evidence)
      3. Target Job Description

      TASK:
      Analyze the alignment between the candidate's verified background and the Job Description.
      Categorize technical skills, tools, and domain keywords according to strict guardrails.

      ${guardrailsText}

      CATEGORIZATION INSTRUCTIONS:
      1. matchingSkills: Skills and tools explicitly present in the Candidate Profile or Resume that directly match JD requirements.
      2. safeInferredSkills: Skills safely inferred using direct logical relationships (e.g., GitHub implies Git, Next.js implies React/JavaScript, PostgreSQL implies SQL). Format each as {"source": "known technology", "implied": "inferred skill", "reason": "why safe"}.
      3. missingSkills: Technologies mentioned in the JD that are not present in the candidate's profile/resume.
      4. unsupportedSkills: Specialized frameworks/ecosystem tools in the JD that the candidate DOES NOT possess and MUST NOT be assumed (e.g., Spring Boot if candidate only has Java; Django if only Python; Kubernetes if only AWS).
      5. summary: A concise 2-sentence executive summary of fit and guardrail boundary.

      INPUTS:
      --- CANDIDATE PROFILE (GROUND TRUTH) ---
      ${candidateProfileText}

      --- RESUME BODY (LATEX) ---
      ${bodyContent}

      --- TARGET JOB DESCRIPTION ---
      ${jobDescription}

      RESPONSE FORMAT (Strict JSON):
      {
        "matchingSkills": ["string"],
        "safeInferredSkills": [{"source": "string", "implied": "string", "reason": "string"}],
        "missingSkills": ["string"],
        "unsupportedSkills": ["string"],
        "summary": "string"
      }
    `;

    const genAI = new GoogleGenAI({ apiKey: config.key });
    const result = await genAI.models.generateContent({
      model: config.model,
      contents: prompt
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No response from AI.");

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned an invalid response format.");

    const data = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      matchingSkills: Array.isArray(data.matchingSkills) ? data.matchingSkills : [],
      safeInferredSkills: Array.isArray(data.safeInferredSkills) ? data.safeInferredSkills : [],
      missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
      unsupportedSkills: Array.isArray(data.unsupportedSkills) ? data.unsupportedSkills : [],
      summary: data.summary || "Alignment analysis completed.",
    };
  } catch (error: any) {
    console.error("Job alignment analysis failed:", error);

    // Graceful fallback to client-side heuristic analyzer if AI fails or rate limits
    if (profile) {
      const fallback = analyzeSkillMatch(profile, resumeLatex, jobDescription);
      return {
        success: true,
        matchingSkills: fallback.matchingSkills,
        missingSkills: fallback.missingSkills,
        safeInferredSkills: fallback.safeInferredSkills.map((s) => ({ ...s, reason: 'Inferred via known ecosystem hierarchy' })),
        unsupportedSkills: fallback.unsupportedSkills,
        summary: `Heuristic analysis: ${fallback.matchingSkills.length} matches identified. (${error.message})`,
      };
    }

    return {
      success: false,
      matchingSkills: [],
      missingSkills: [],
      safeInferredSkills: [],
      unsupportedSkills: [],
      error: error.message || "An unexpected error occurred during alignment analysis.",
    };
  }
}

/**
 * Resume & Cover Letter Optimization Action
 */
export async function optimizeResumeAction(
  resumeLatex: string,
  jobDescription: string,
  config: { key: string; model: GeminiModel },
  coverLetterTemplate?: string,
  profile?: CandidateProfile
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

    const candidateProfileText = formatCandidateProfileForPrompt(profile);
    const guardrailsText = getGuardrailsPrompt();

    // 2. Construct Prompt with Strict Guardrails and Profile Truths
    const prompt = `
      You are an expert career strategist and high-precision LaTeX specialist.
      I will provide you with:
      1. Candidate Profile (Verified Truth)
      2. LaTeX Resume Body (Existing Primary Evidence)
      3. Target Job Description (Requirements to match against known skills)
      4. Optionally, a Cover Letter template body

      GOAL:
      1. Optimize the Resume Body to highlight verified candidate skills that match the Job Description.
      2. Draft a high-impact, tailored Cover Letter reflecting verified qualifications.

      ${guardrailsText}

      STRICT RULES FOR RESUME OPTIMIZATION:
      1. PRESERVE ALL EXISTING SECTIONS & ENTRIES:
         - NEVER drop, delete, or omit existing sections (Projects, Certifications, Education, Experience, Awards, etc.).
         - All existing projects, jobs, credentials, and sections in the source resume MUST remain in the optimized output.

      2. SKILLS INTEGRITY (NO DELETIONS & NO VAGUE SKILLS):
         - Do NOT remove or wipe out the candidate's existing skills.
         - Do NOT add vague, soft-skill, or generic buzzwords (e.g., "Problem Solver", "Team Player", "Communication", "Critical Thinking", "Fast Learner").
         - Retain existing technical skills, reorder them for relevance, and add matching concrete verified technical skills/tools from the Candidate Profile.

      3. ALLOWED MODIFICATION SCOPE (ONLY MODIFY THESE 3 PARTS):
         - Professional Summary / Profile / Objective: Tailor value proposition to align with the target role.
         - Skills & Tools: Reorder, emphasize, and augment with relevant verified technical proficiencies.
         - Project and Experience summaries / bullet points: Refine descriptions and accomplishments to highlight relevant technologies and impact matching the JD.

      4. UNALTERABLE FACTS:
         - NEVER alter personal names, contact info/links, degree names, university names, GPA, company names, dates, or formal job titles.
         - NEVER fabricate fake experience, fake metrics, or unsupported technologies.

      5. LATEX SYNTAX PRECISION:
         - Maintain the exact LaTeX structure, commands, environments, and formatting with 100% syntactic precision.
         - Return ONLY the updated LaTeX body content. Do NOT include the preamble or the \\begin/\\end document tags.

      STRICT RULES FOR COVER LETTER:
      ${coverLetterTemplate ? '- I have provided a Cover Letter template body. REWRITE the body content inside while preserving the overall LaTeX structure and contact information.' : '- Draft a brief, compelling cover letter tailored to the JD. Return as plain text content.'}
      - Focus on solving the company\'s specific challenges using the candidate\'s ACTUAL verified background.
      - Do NOT claim any unsupported technologies from the JD.
      - DO NOT include placeholder tokens like [Company Name], [Job Title], etc. Fill in real details derived from the inputs.
      - Keep it concise, natural, and human.

      INPUTS:
      --- CANDIDATE PROFILE (GROUND TRUTH) ---
      ${candidateProfileText}

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
