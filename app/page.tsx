'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCandidateProfile } from '@/hooks/use-candidate-profile';
import { useGeminiConfig } from '@/hooks/use-gemini-config';

interface SavedJob {
  id: string;
  companyName: string;
  jobDescription: string;
  timestamp: number;
}

export default function Home() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const { profile } = useCandidateProfile();
  const { keys } = useGeminiConfig();

  useEffect(() => {
    const saved = localStorage.getItem('job_history');
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch {
        console.error('Failed to parse job history');
      }
    }
    setIsHydrated(true);
  }, []);

  const handleLoadJob = (job: SavedJob) => {
    sessionStorage.setItem('target_company', job.companyName);
    sessionStorage.setItem('target_jd', job.jobDescription);
    router.push('/workspace');
  };

  const handleDeleteJob = (id: string) => {
    const updated = jobs.filter((j) => j.id !== id);
    setJobs(updated);
    localStorage.setItem('job_history', JSON.stringify(updated));
  };

  const totalProfileItems =
    (profile.skills?.length || 0) +
    (profile.tools?.length || 0) +
    (profile.certifications?.length || 0) +
    (profile.achievements?.length || 0);

  const hasApiKey = keys.length > 0;

  return (
    <div className='flex-1 overflow-y-auto bg-mesh custom-scrollbar'>
      <div className='max-w-5xl mx-auto px-6 sm:px-10 py-10 space-y-10'>
        {/* ── Welcome Header ── */}
        <div className='space-y-3'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold'>
            <span className='w-1.5 h-1.5 rounded-full bg-accent animate-pulse' />
            Job Application Workspace
          </div>
          <h1 className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
            Welcome to Resumate
          </h1>
          <p className='text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed'>
            Manage your master LaTeX resume, enforce verified qualifications with AI guardrails, and tailor applications to any job description.
          </p>
        </div>

        {/* ── Readiness / Status Cards ── */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {/* Candidate Profile Status */}
          <div className='p-5 rounded-2xl bg-[#121215] border border-white/8 space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-xs font-bold text-white uppercase tracking-wider'>Candidate Profile</h3>
                  <p className='text-[11px] text-white/40'>Verified qualifications ground truth</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                totalProfileItems > 0
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {totalProfileItems > 0 ? `${totalProfileItems} Items` : 'Incomplete'}
              </span>
            </div>
            <p className='text-xs text-white/60 leading-relaxed'>
              {totalProfileItems > 0
                ? 'Your qualifications are active. AI tailoring is strictly constrained from fabricating outside this list.'
                : 'Add your verified skills, tools, and certifications so the AI never invents unsupported claims.'}
            </p>
          </div>

          {/* Gemini API Key Status */}
          <div className='p-5 rounded-2xl bg-[#121215] border border-white/8 space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-xs font-bold text-white uppercase tracking-wider'>Gemini AI Engine</h3>
                  <p className='text-[11px] text-white/40'>Inference credentials</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${
                hasApiKey
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {hasApiKey ? 'Ready' : 'Key Needed'}
              </span>
            </div>
            <p className='text-xs text-white/60 leading-relaxed'>
              {hasApiKey
                ? `${keys.length} API key(s) configured in browser storage for job alignment analysis and tailoring.`
                : 'Configure a Google Gemini API key in Settings to enable AI match analysis and resume tailoring.'}
            </p>
          </div>
        </div>

        {/* ── Primary Action Workspaces ── */}
        <div className='space-y-4'>
          <h2 className='text-xs font-bold uppercase tracking-wider text-white/40'>
            Workspaces & Actions
          </h2>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {/* Primary Action 1: Tailor to Job */}
            <Link
              href='/workspace'
              className='group p-6 rounded-2xl bg-accent text-black hover:scale-[1.01] active:scale-98 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-8'>
              <div className='space-y-3'>
                <div className='w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center text-black font-bold'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M13 10V3L4 14h7v7l9-11h-7z' />
                  </svg>
                </div>
                <h3 className='text-xl font-bold tracking-tight text-black'>
                  Tailor to Job
                </h3>
                <p className='text-xs text-black/75 font-medium leading-relaxed'>
                  Paste a job description, analyze skill fit, and generate an AI-tailored resume draft.
                </p>
              </div>
              <div className='flex items-center gap-1.5 text-xs font-bold'>
                <span>Start Tailoring</span>
                <span className='group-hover:translate-x-1 transition-transform'>→</span>
              </div>
            </Link>

            {/* Primary Action 2: Master Resume */}
            <Link
              href='/editor?tab=resume'
              className='group p-6 rounded-2xl bg-[#121215] border border-white/8 hover:border-white/20 hover:bg-[#18181d] transition-all duration-300 flex flex-col justify-between space-y-8'>
              <div className='space-y-3'>
                <div className='w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <h3 className='text-xl font-bold tracking-tight text-white'>
                  Master Resume
                </h3>
                <p className='text-xs text-white/50 leading-relaxed'>
                  Edit your base LaTeX resume source with live PDF compilation and focus modes.
                </p>
              </div>
              <div className='flex items-center gap-1.5 text-xs font-semibold text-white/70 group-hover:text-white'>
                <span>Open Editor</span>
                <span className='group-hover:translate-x-1 transition-transform'>→</span>
              </div>
            </Link>

            {/* Primary Action 3: Master Cover Letter */}
            <Link
              href='/editor?tab=cover_letter'
              className='group p-6 rounded-2xl bg-[#121215] border border-white/8 hover:border-white/20 hover:bg-[#18181d] transition-all duration-300 flex flex-col justify-between space-y-8'>
              <div className='space-y-3'>
                <div className='w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white'>
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                </div>
                <h3 className='text-xl font-bold tracking-tight text-white'>
                  Cover Letter
                </h3>
                <p className='text-xs text-white/50 leading-relaxed'>
                  Draft and maintain your master cover letter LaTeX template and layout.
                </p>
              </div>
              <div className='flex items-center gap-1.5 text-xs font-semibold text-white/70 group-hover:text-white'>
                <span>Open Cover Letter</span>
                <span className='group-hover:translate-x-1 transition-transform'>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Recent Targets History ── */}
        {isHydrated && jobs.length > 0 && (
          <div className='space-y-4 pt-4'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-white/40'>
              Recent Job Targets ({jobs.length})
            </h2>

            <div className='grid grid-cols-1 gap-3'>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className='p-5 rounded-xl bg-[#121215] border border-white/8 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='space-y-1 min-w-0'>
                    <div className='flex items-center gap-3'>
                      <h4 className='text-sm font-bold text-white capitalize truncate'>
                        {job.companyName || 'Untitled Target'}
                      </h4>
                      <span className='px-2 py-0.5 rounded text-[10px] text-white/40 bg-white/5 border border-white/5'>
                        {new Date(job.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className='text-xs text-white/50 line-clamp-1 max-w-xl'>
                      {job.jobDescription}
                    </p>
                  </div>

                  <div className='flex items-center gap-2 shrink-0'>
                    <button
                      onClick={() => handleLoadJob(job)}
                      className='px-4 py-2 bg-accent text-black text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm'>
                      Tailor
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className='p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                      title='Delete Record'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
