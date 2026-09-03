'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';

const ONBOARDING_KEY = 'resumate_onboarding_done';

const STEPS = [
  {
    step: 1,
    icon: (
      <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2.5'
          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
        />
      </svg>
    ),
    label: 'Your Resume',
    title: 'Start with your master resume',
    description:
      'Resumate works with LaTeX resumes. Open the Resume page to paste your existing LaTeX source, or start from the provided template. This becomes your master copy — it is never modified by the AI.',
    action: {href: '/editor?tab=resume', label: 'Open Resume →'},
    detail: ['📄 LaTeX source with full PDF preview', '✏️ Edit body content or full LaTeX preamble', '💾 Auto-saved to local storage on every keystroke'],
  },
  {
    step: 2,
    icon: (
      <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
      </svg>
    ),
    label: 'Candidate Profile',
    title: 'Define your verified qualifications',
    description:
      'Your Candidate Profile is the ground truth Resumate uses to guard AI output. The AI will never invent skills, tools, or qualifications that are not listed here.',
    action: {href: '/profile', label: 'Open Profile →'},
    detail: [
      '🛡️ Skills and developer tools ground truth',
      '🚫 AI is forbidden from fabricating missing qualifications',
      '🔍 Used for real-time job fit analysis before tailoring',
    ],
  },
  {
    step: 3,
    icon: (
      <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2.5'
          d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
        />
      </svg>
    ),
    label: 'Gemini API Key',
    title: 'Connect the AI engine',
    description:
      'Resumate uses Google Gemini for AI analysis and tailoring. Add your free API key in Settings. Your key is stored entirely in your browser — it is never sent to any server other than Google.',
    action: {href: '/settings', label: 'Open Settings →'},
    detail: [
      '🔒 Stored in sessionStorage or localStorage (your choice)',
      '⏱️ Optional expiration: 24h, 7 days, or until deleted',
      '🗑️ Clear anytime from Settings → Clear All Local Data',
    ],
  },
  {
    step: 4,
    icon: (
      <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M13 10V3L4 14h7v7l9-11h-7z' />
      </svg>
    ),
    label: 'Tailor to Job',
    title: 'Tailor your resume to any job',
    description:
      'The Tailor to Job workflow lets you paste a job description, run an AI fit analysis, then generate a tailored version of your resume — without touching your master copy.',
    action: {href: '/workspace', label: 'Open Tailor to Job →'},
    detail: ['📋 Paste JD → Analyze Match', '⚡ Tailor Resume (guarded by your profile)', '🔍 Review Changes in diff viewer → Export PDF'],
  },
];

export function OnboardingModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        setIsVisible(true);
      }
    } catch {
      // Ignore SSR/storage errors
    }
  }, []);

  const handleFinish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // Ignore
    }
    setIsVisible(false);
  };

  const handleSkip = () => {
    handleFinish();
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className='fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300'>
      <div className='relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden'>
        {/* Progress Bar */}
        <div className='h-0.5 bg-white/5'>
          <div className='h-full bg-accent transition-all duration-500 ease-out' style={{width: `${((currentStep + 1) / STEPS.length) * 100}%`}} />
        </div>

        {/* Header */}
        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
          <div className='flex items-center gap-2'>
            {STEPS.map((s, i) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentStep ? 'w-6 h-2 bg-accent'
                  : i < currentStep ? 'w-2 h-2 bg-accent/40'
                  : 'w-2 h-2 bg-white/15'
                }`}
                title={s.label}
              />
            ))}
          </div>
          <button onClick={handleSkip} className='text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors'>
            Skip tutorial
          </button>
        </div>

        {/* Step Content */}
        <div className='px-6 pb-6 space-y-5'>
          {/* Icon & Step Label */}
          <div className='flex items-center gap-4'>
            <div className='shrink-0 w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent'>{step.icon}</div>
            <div>
              <div className='text-[10px] font-black uppercase tracking-[0.3em] text-accent/70 mb-0.5'>
                Step {step.step} of {STEPS.length}
              </div>
              <h2 className='text-xl font-black text-white tracking-tight leading-tight'>{step.title}</h2>
            </div>
          </div>

          {/* Description */}
          <p className='text-sm text-white/70 leading-relaxed'>{step.description}</p>

          {/* Detail Bullets */}
          <ul className='space-y-2'>
            {step.detail.map((d, i) => (
              <li key={i} className='text-xs text-white/50 font-medium flex items-start gap-2'>
                <span>{d}</span>
              </li>
            ))}
          </ul>

          {/* Step Action */}
          {step.action && (
            <div className='pt-1'>
              <Link
                href={step.action.href}
                onClick={handleFinish}
                className='inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all'>
                {step.action.label}
              </Link>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className='flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/2'>
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className='px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-white disabled:opacity-20 transition-colors rounded-xl hover:bg-white/5'>
            ← Back
          </button>

          {isLast ?
            <button
              onClick={handleFinish}
              className='px-6 py-2.5 bg-accent text-black text-[11px] font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(136,255,0,0.3)]'>
              Get Started ✓
            </button>
          : <button
              onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className='px-6 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-accent transition-all active:scale-95'>
              Next →
            </button>
          }
        </div>
      </div>
    </div>
  );
}

/** Call this to mark onboarding as complete and dismiss it */
export function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    /* noop */
  }
}

/** Call this to reset onboarding so it shows again on next load */
export function resetOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    /* noop */
  }
}
