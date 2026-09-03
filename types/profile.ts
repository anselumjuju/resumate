export type ProfileCategory = 'skills' | 'tools';

export interface CandidateProfile {
  skills: string[];
  tools: string[];
}

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  skills: [
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'PostgreSQL',
    'TailwindCSS',
  ],
  tools: [
    'Git',
    'GitHub',
    'Docker',
    'VS Code',
    'Postman',
    'Figma',
  ],
};
