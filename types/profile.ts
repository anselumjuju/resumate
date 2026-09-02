export interface CertificationItem {
  title: string;
  description: string;
  link?: string;
}

export interface AchievementItem {
  title: string;
  description: string;
}

export interface CandidateProfile {
  skills: string[];
  tools: string[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
}

export type ProfileCategory = keyof CandidateProfile;

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  skills: [],
  tools: [],
  certifications: [],
  achievements: [],
};
