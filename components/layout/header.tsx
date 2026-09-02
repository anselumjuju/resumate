'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGeminiConfig } from '@/hooks/use-gemini-config';
import { useCandidateProfile } from '@/hooks/use-candidate-profile';
import { CandidateProfilePanel } from '@/components/profile/candidate-profile-panel';
import { GeminiConfigPanel } from '@/components/ai/gemini-config-panel';
import { OnboardingModal, resetOnboarding } from '@/components/onboarding/onboarding-modal';

export function Header() {
  const pathname = usePathname();
  const { isDirty, setIsDirty, keys } = useGeminiConfig();
  const { profile } = useCandidateProfile();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNavigation = (e: React.MouseEvent) => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave? Your progress will be lost.');
      if (!confirmed) {
        e.preventDefault();
        return;
      }
      setIsDirty(false);
    }
  };

  const totalProfileItems =
    (profile.skills?.length || 0) +
    (profile.tools?.length || 0) +
    (profile.certifications?.length || 0) +
    (profile.achievements?.length || 0);

  return (
    <>
      <header className='sticky top-0 z-50 w-full border-b border-white/5 bg-black/20 backdrop-blur-xl shrink-0'>
        <div className='flex h-14 items-center justify-between px-6 w-full mx-auto'>
          {/* Logo */}
          <Link href='/' onClick={(e) => handleNavigation(e)} className='flex items-center gap-2.5 group'>
            <div className='w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black shadow-[0_0_20px_rgba(136,255,0,0.4)] group-hover:scale-105 group-hover:rotate-6 transition-all duration-500'>
              <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M12 2L2 7l10 5 10-5-10-5z' />
                <path d='M2 17l10 5 10-5' />
                <path d='M2 12l10 5 10-5' />
                <circle cx='12' cy='7' r='1' fill='currentColor' />
              </svg>
            </div>
            <span className='font-black text-lg tracking-tighter text-white'>resumate</span>
          </Link>

          {/* Navigation Links */}
          <nav className='flex items-center gap-2'>
            {/* Resume */}
            <Link
              href='/editor?tab=resume'
              onClick={(e) => handleNavigation(e)}
              className={`relative text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 px-3.5 py-2 rounded-xl ${
                pathname === '/editor'
                  ? 'text-accent bg-accent/10 border border-accent/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}>
              Resume
            </Link>

            {/* Cover Letter */}
            <Link
              href='/editor?tab=cover_letter'
              onClick={(e) => handleNavigation(e)}
              className='relative text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 px-3.5 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5'>
              Cover Letter
            </Link>

            {/* Tailor to Job */}
            <Link
              href='/workspace'
              onClick={(e) => handleNavigation(e)}
              className={`relative text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 px-3.5 py-2 rounded-xl ${
                pathname === '/workspace'
                  ? 'text-accent bg-accent/10 border border-accent/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}>
              Tailor to Job
            </Link>

            {/* Profile Trigger */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className='flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 px-3.5 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent hover:border-white/10'>
              <span>Profile</span>
              {totalProfileItems > 0 && (
                <span className='px-1.5 py-0.2 rounded-full bg-accent/10 border border-accent/20 text-accent text-[9px] font-black'>
                  {totalProfileItems}
                </span>
              )}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className='flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 px-3.5 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent hover:border-white/10'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'
                />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
              <span>Settings</span>
              {keys.length > 0 && (
                <span className='w-1.5 h-1.5 rounded-full bg-accent' />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* ── Global Candidate Profile Modal ── */}
      {isProfileOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'>
          <div className='relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar'>
            <div className='flex items-center justify-between pb-4 border-b border-white/5'>
              <div className='flex items-center gap-3'>
                <div className='w-2.5 h-2.5 rounded-full bg-accent animate-pulse' />
                <div>
                  <h3 className='text-lg font-black text-white tracking-tight'>Candidate Profile</h3>
                  <p className='text-xs text-white/40'>Ground truth verified qualifications & skills</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className='p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all'
                title='Close'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <CandidateProfilePanel />

            <div className='flex justify-end pt-4 border-t border-white/5'>
              <button
                onClick={() => setIsProfileOpen(false)}
                className='px-6 py-2.5 bg-accent text-black text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg'>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding Modal ── */}
      <OnboardingModal />

      {/* ── Global Settings Modal ── */}
      {isSettingsOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'>
          <div className='relative w-full max-w-xl bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar'>
            <div className='flex items-center justify-between pb-4 border-b border-white/5'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-accent/10 text-accent rounded-xl'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2.5'
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'
                    />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-black text-white tracking-tight'>Settings</h3>
                  <p className='text-xs text-white/40'>AI Inference Models, API Credentials & Data Storage</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className='p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all'
                title='Close'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <GeminiConfigPanel />

            <div className='flex items-center justify-between pt-4 border-t border-white/5'>
              <button
                onClick={() => {
                  resetOnboarding();
                  setIsSettingsOpen(false);
                  window.location.reload();
                }}
                className='text-[10px] font-black uppercase tracking-wider text-white/30 hover:text-white/60 px-3 py-2 rounded-xl hover:bg-white/5 transition-all flex items-center gap-1.5'>
                <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5'
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                </svg>
                Restart Tutorial
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className='px-6 py-2.5 bg-accent text-black text-xs font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg'>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
