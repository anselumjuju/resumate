/**
 * Resumate Storage Keys Registry
 * All local storage keys owned and managed by the Resumate application.
 */
export const RESUMATE_LOCAL_KEYS = [
  'gemini_config',
  'candidate_profile',
  'base_resume',
  'base_cover_letter',
  'job_history',
  'resumate_onboarding_done',
] as const;

export const RESUMATE_SESSION_KEYS = [
  'gemini_session_keys',
  'target_company',
  'target_jd',
] as const;

/**
 * Safely removes only Resumate-owned keys from localStorage and sessionStorage.
 * Never performs a blind localStorage.clear() to avoid interfering with third-party extensions or other local apps.
 */
export function clearAllResumateStorage(): void {
  if (typeof window === 'undefined') return;

  // Clear specific local storage keys
  for (const key of RESUMATE_LOCAL_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove localStorage key "${key}":`, e);
    }
  }

  // Clear specific session storage keys
  for (const key of RESUMATE_SESSION_KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove sessionStorage key "${key}":`, e);
    }
  }
}
