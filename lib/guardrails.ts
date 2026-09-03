import { CandidateProfile } from '@/types/profile';

/**
 * Explicit Safe Inferences Catalog.
 * Knowing technology A safely implies knowledge of foundational or direct parent technology B.
 */
export const SAFE_INFERENCES: Record<string, string[]> = {
  github: ['git'],
  gitlab: ['git'],
  react: ['javascript', 'frontend development'],
  'react.js': ['javascript', 'react', 'frontend development'],
  'next.js': ['react', 'javascript', 'frontend development'],
  nextjs: ['react', 'javascript', 'frontend development'],
  typescript: ['javascript'],
  postgresql: ['sql', 'relational databases'],
  postgres: ['sql', 'relational databases'],
  mysql: ['sql', 'relational databases'],
  sqlite: ['sql', 'relational databases'],
  mongodb: ['nosql', 'databases'],
  sass: ['css'],
  scss: ['css'],
  tailwindcss: ['css'],
  tailwind: ['css'],
  express: ['node.js', 'javascript', 'backend development'],
  'express.js': ['node.js', 'javascript', 'backend development'],
  fastapi: ['python', 'backend development'],
  flask: ['python', 'backend development'],
  django: ['python', 'backend development'],
  spring: ['java'],
  'spring boot': ['java', 'spring'],
};

/**
 * Explicit Prohibited Inferences for AI Prompts.
 * Ecosystem presence does NOT grant knowledge of adjacent specialized frameworks.
 */
export const PROHIBITED_INFERENCES = [
  { known: 'Java', prohibited: 'Spring Boot, Quarkus, Micronaut' },
  { known: 'Python', prohibited: 'Django, FastAPI, PyTorch, TensorFlow' },
  { known: 'JavaScript', prohibited: 'Node.js, React, Angular, Vue (unless explicitly listed)' },
  { known: 'AWS', prohibited: 'Kubernetes, Terraform, GCP, Azure' },
  { known: 'React', prohibited: 'React Native, Angular, Vue' },
  { known: 'SQL / PostgreSQL', prohibited: 'DBA Administration, MongoDB, Cassandra' },
];

/**
 * Format Candidate Profile as structured text for the AI prompt.
 */
export function formatCandidateProfileForPrompt(profile?: CandidateProfile): string {
  if (!profile) return 'No Candidate Profile provided.';

  const hasAny = (profile.skills?.length || 0) > 0 || (profile.tools?.length || 0) > 0;

  if (!hasAny) {
    return 'Candidate Profile is currently empty. Rely strictly on existing Resume content.';
  }

  const sections: string[] = [];

  if (profile.skills?.length) {
    sections.push(`- Verified Skills: ${profile.skills.join(', ')}`);
  }
  if (profile.tools?.length) {
    sections.push(`- Verified Tools & Platforms: ${profile.tools.join(', ')}`);
  }

  return sections.join('\n');
}

/**
 * Guardrail instructions for the Gemini prompt.
 */
export function getGuardrailsPrompt(): string {
  return `
--- AI GUARDRAILS & INTEGRITY CONSTRAINTS (STRICT ENFORCEMENT) ---
1. SOURCES OF TRUTH:
   - Primary Source: The existing Resume LaTeX content.
   - Secondary Source: The Candidate Profile provided below (Verified Skills and Tools).
   - You MUST NEVER invent skills, technologies, frameworks, certifications, employer names, or qualifications not substantiated by either source.

2. UNSUPPORTED TECHNOLOGIES IN JOB DESCRIPTION:
   - If the Job Description mentions technologies (e.g., Spring Boot, AWS, Docker, Kubernetes) that do NOT exist in the candidate's Resume or Candidate Profile, you MUST treat them as UNSUPPORTED.
   - You MUST NOT add unsupported technologies to the resume or cover letter simply because the Job Description asks for them.
   - Emphasize and tailor ONLY the subset of technologies and skills that the candidate actually possesses.

3. SKILL INFERENCE RULES:
   - ALLOWED SAFE INFERENCES: You may make safe, direct inferences where knowing technology A directly implies foundational knowledge of B (e.g., GitHub -> Git, Next.js -> React/JavaScript, PostgreSQL -> SQL, TypeScript -> JavaScript).
   - STRICTLY PROHIBITED INFERENCES: You must NEVER assume knowledge of adjacent frameworks or ecosystem tools (e.g., Java DOES NOT imply Spring Boot; Python DOES NOT imply Django; JavaScript DOES NOT imply Node.js; React DOES NOT imply React Native; AWS DOES NOT imply Kubernetes).

4. PRESERVE ALL EXISTING RESUME SECTIONS:
   - You MUST NEVER drop, delete, or omit existing sections (e.g., Projects, Certifications, Education, Work Experience, Awards). Every section and entry present in the original resume must remain in the output.

5. SKILLS INTEGRITY & NO VAGUE FILLERS:
   - Do NOT wipe out or remove existing skills from the resume.
   - Do NOT add vague, soft-skill, or generic filler keywords (e.g., "Problem Solving", "Team Player", "Communication", "Fast Learner", "Leadership", "Hard Working").
   - ONLY add concrete, verified technical skills, frameworks, languages, and developer tools from the Candidate Profile that are relevant to the target Job Description.

6. ALLOWED MODIFICATION SCOPE (ONLY THESE 3 AREAS):
   - Summary / Objective: Align summary statement with target job requirements.
   - Skills & Tools: Preserve existing skills, reorder for relevance, and add matching verified technical skills.
   - Project & Experience summaries / bullet points: Refine technical phrasing and highlight relevant accomplishments that match JD keywords without fabricating fake facts.

7. STRICTLY FORBIDDEN:
   - NEVER modify company/employer names, formal job titles, employment dates, university names, degree names, GPA, candidate name, or contact links.
`;
}

/**
 * Skill alignment structure.
 */
export interface SkillMatchAnalysis {
  matchingSkills: string[];
  missingSkills: string[];
  safeInferredSkills: { source: string; implied: string }[];
  unsupportedSkills: string[];
}

/**
 * Computes skill alignment between Candidate (Profile + Resume) and Job Description.
 */
export function analyzeSkillMatch(
  profile: CandidateProfile,
  resumeText: string,
  jdText: string
): SkillMatchAnalysis {
  const normalize = (s: string) => s.toLowerCase().trim();

  // Extract known items from profile
  const knownSet = new Set<string>();
  [
    ...(profile.skills || []),
    ...(profile.tools || []),
  ]
    .filter(Boolean)
    .forEach((item) => knownSet.add(normalize(item)));

  // Add lowercase tokens from resume
  const resumeNormalized = resumeText.toLowerCase();

  // Determine safe inferences from known items
  const inferredMap = new Map<string, string>();
  for (const known of knownSet) {
    const implied = SAFE_INFERENCES[known];
    if (implied) {
      for (const imp of implied) {
        if (!knownSet.has(imp)) {
          inferredMap.set(imp, known);
        }
      }
    }
  }

  // Tokenize JD terms for simple extraction
  const jdWords = jdText
    .split(/[\s,;/()]+/)
    .map(normalize)
    .filter((w) => w.length > 1);

  const matchingSkills = new Set<string>();
  const safeInferredSkills: { source: string; implied: string }[] = [];
  const missingOrUnsupported = new Set<string>();

  for (const word of jdWords) {
    if (knownSet.has(word) || resumeNormalized.includes(word)) {
      matchingSkills.add(word);
    } else if (inferredMap.has(word)) {
      safeInferredSkills.push({
        source: inferredMap.get(word)!,
        implied: word,
      });
    } else {
      missingOrUnsupported.add(word);
    }
  }

  return {
    matchingSkills: Array.from(matchingSkills),
    missingSkills: Array.from(missingOrUnsupported),
    safeInferredSkills,
    unsupportedSkills: Array.from(missingOrUnsupported),
  };
}
