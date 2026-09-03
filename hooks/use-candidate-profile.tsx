'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CandidateProfile, ProfileCategory, DEFAULT_CANDIDATE_PROFILE } from '@/types/profile';

const STORAGE_KEY = 'candidate_profile';

interface CandidateProfileContextType {
  profile: CandidateProfile;
  isLoaded: boolean;
  addSimpleItem: (category: ProfileCategory, item: string) => void;
  removeSimpleItem: (category: ProfileCategory, index: number) => void;
  editSimpleItem: (category: ProfileCategory, index: number, newItem: string) => void;
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
        setProfile({
          skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === 'string') : DEFAULT_CANDIDATE_PROFILE.skills,
          tools: Array.isArray(parsed.tools) ? parsed.tools.filter((t: any) => typeof t === 'string') : DEFAULT_CANDIDATE_PROFILE.tools,
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

  const addSimpleItem = useCallback((category: ProfileCategory, item: string) => {
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

  const removeSimpleItem = useCallback((category: ProfileCategory, index: number) => {
    setProfile((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index),
    }));
  }, []);

  const editSimpleItem = useCallback((category: ProfileCategory, index: number, newItem: string) => {
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

  const removeItem = useCallback((category: ProfileCategory, index: number) => {
    setProfile((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== index),
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
