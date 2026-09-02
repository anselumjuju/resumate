import { Metadata } from 'next';
import { CandidateProfilePanel } from '@/components/profile/candidate-profile-panel';

export const metadata: Metadata = {
  title: 'Candidate Profile | Resumate',
  description: 'Manage verified skills, tools, certifications, and achievements for AI guardrails.',
};

export default function ProfilePage() {
  return (
    <div className='flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden'>
      {/* ── Top Header ── */}
      <div className='h-14 px-6 sm:px-8 border-b border-white/8 bg-[#0c0c0e] flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='w-2 h-2 rounded-full bg-accent animate-pulse' />
          <div>
            <h1 className='text-sm font-bold text-white tracking-tight'>
              Candidate Profile
            </h1>
          </div>
        </div>
        <span className='text-xs text-white/40'>Ground Truth Guardrails</span>
      </div>

      {/* ── Main Full-Page Content ── */}
      <div className='flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10'>
        <div className='max-w-4xl mx-auto space-y-8'>
          <div className='space-y-1.5'>
            <h2 className='text-2xl font-bold text-white tracking-tight'>
              Verified Candidate Qualifications
            </h2>
            <p className='text-xs sm:text-sm text-white/50 leading-relaxed max-w-2xl'>
              This profile serves as the absolute ground truth for AI resume tailoring. Resumate uses these verified records to prevent the AI from ever inventing skills, tools, or credentials you haven&apos;t earned.
            </p>
          </div>

          <CandidateProfilePanel />
        </div>
      </div>
    </div>
  );
}
