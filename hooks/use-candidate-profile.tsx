'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  CandidateProfile,
  ProfileCategory,
  CertificationItem,
  AchievementItem,
  DEFAULT_CANDIDATE_PROFILE,
} from '@/types/profile';

const STORAGE_KEY = 'candidate_profile';

interface CandidateProfileContextType {
  profile: CandidateProfile;
  isLoaded: boolean;
  addSimpleItem: (category: 'skills' | 'tools', item: string) => void;
  removeSimpleItem: (category: 'skills' | 'tools', index: number) => void;
  editSimpleItem: (category: 'skills' | 'tools', index: number, newItem: string) => void;
  addCertification: (item: CertificationItem) => void;
  removeCertification: (index: number) => void;
  editCertification: (index: number, item: CertificationItem) => void;
  addAchievement: (item: AchievementItem) => void;
  removeAchievement: (index: number) => void;
  editAchievement: (index: number, item: AchievementItem) => void;
  removeItem: (category: ProfileCategory, index: number) => void;
  resetProfile: () => void;
}

const CandidateProfileContext = createContext<CandidateProfileContextType | undefined>(undefined);

export function CandidateProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_CANDIDATE_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        const normalizeCert = (item: any): CertificationItem => {
          if (typeof item === 'string') {
            return { title: item, description: '', link: '' };
          }
          return {
            title: item?.title || '',
            description: item?.description || '',
            link: item?.link || '',
          };
        };

        const normalizeAchievement = (item: any): AchievementItem => {
          if (typeof item === 'string') {
            return { title: item, description: '' };
          }
          return {
            title: item?.title || '',
            description: item?.description || '',
          };
        };

        setProfile({
          skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === 'string') : [],
          tools: Array.isArray(parsed.tools) ? parsed.tools.filter((t: any) => typeof t === 'string') : [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications.map(normalizeCert) : [],
          achievements: Array.isArray(parsed.achievements) ? parsed.achievements.map(normalizeAchievement) : [],
        });
      } catch (e) {
        console.error('Failed to parse candidate profile from localStorage', e);
        setProfile(DEFAULT_CANDIDATE_PROFILE);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  const addSimpleItem = useCallback((category: 'skills' | 'tools', item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;

    setProfile((prev) => {
      const currentList = prev[category] || [];
      if (currentList.includes(trimmed)) return prev;
      return {
        ...prev,
        [category]: [...currentList, trimmed],
      };
    });
  }, []);

  const removeSimpleItem = useCallback((category: 'skills' | 'tools', index: number) => {
    setProfile((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index),
    }));
  }, []);

  const editSimpleItem = useCallback((category: 'skills' | 'tools', index: number, newItem: string) => {
    const trimmed = newItem.trim();
    if (!trimmed) return;

    setProfile((prev) => {
      const currentList = [...(prev[category] || [])];
      if (index >= 0 && index < currentList.length) {
        currentList[index] = trimmed;
      }
      return {
        ...prev,
        [category]: currentList,
      };
    });
  }, []);

  const addCertification = useCallback((item: CertificationItem) => {
    if (!item.title.trim()) return;
    setProfile((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        {
          title: item.title.trim(),
          description: item.description.trim(),
          link: item.link?.trim() || undefined,
        },
      ],
    }));
  }, []);

  const removeCertification = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index),
    }));
  }, []);

  const editCertification = useCallback((index: number, item: CertificationItem) => {
    if (!item.title.trim()) return;
    setProfile((prev) => {
      const current = [...(prev.certifications || [])];
      if (index >= 0 && index < current.length) {
        current[index] = {
          title: item.title.trim(),
          description: item.description.trim(),
          link: item.link?.trim() || undefined,
        };
      }
      return { ...prev, certifications: current };
    });
  }, []);

  const addAchievement = useCallback((item: AchievementItem) => {
    if (!item.title.trim()) return;
    setProfile((prev) => ({
      ...prev,
      achievements: [
        ...(prev.achievements || []),
        {
          title: item.title.trim(),
          description: item.description.trim(),
        },
      ],
    }));
  }, []);

  const removeAchievement = useCallback((index: number) => {
    setProfile((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index),
    }));
  }, []);

  const editAchievement = useCallback((index: number, item: AchievementItem) => {
    if (!item.title.trim()) return;
    setProfile((prev) => {
      const current = [...(prev.achievements || [])];
      if (index >= 0 && index < current.length) {
        current[index] = {
          title: item.title.trim(),
          description: item.description.trim(),
        };
      }
      return { ...prev, achievements: current };
    });
  }, []);

  const removeItem = useCallback((category: ProfileCategory, index: number) => {
    setProfile((prev) => ({
      ...prev,
      [category]: (prev[category] as any[]).filter((_, i) => i !== index),
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_CANDIDATE_PROFILE);
  }, []);

  return (
    <CandidateProfileContext.Provider
      value={{
        profile,
        isLoaded,
        addSimpleItem,
        removeSimpleItem,
        editSimpleItem,
        addCertification,
        removeCertification,
        editCertification,
        addAchievement,
        removeAchievement,
        editAchievement,
        removeItem,
        resetProfile,
      }}>
      {children}
    </CandidateProfileContext.Provider>
  );
}

export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext);
  if (context === undefined) {
    throw new Error('useCandidateProfile must be used within a CandidateProfileProvider');
  }
  return context;
}
