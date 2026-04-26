'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

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

  return (
    <div className='flex min-h-max h-dvh w-full bg-mesh relative'>
      <div className='max-w-5xl mx-auto px-8 py-16 space-y-16'>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className='space-y-6'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-[0.3em]'>
            <div className='w-1.5 h-1.5 rounded-full bg-accent animate-pulse' />
            Intelligence Driven
          </div>
          <h1 className='text-6xl md:text-7xl font-black tracking-tight text-white leading-[0.95]'>
            The future of <br />
            <span className='text-accent'>resumes.</span>
          </h1>
          <p className='text-xl text-neutral-400 max-w-xl leading-relaxed font-medium'>A high-precision LaTeX transformer designed for the modern career.</p>
        </section>

        {/* ── Bento Grid ────────────────────────────────────────── */}
        <section className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <Link
            href='/editor'
            className='md:col-span-2 group relative overflow-hidden rounded-3xl bg-white/[0.05] border border-white/5 p-8 backdrop-blur-xl hover:border-accent/40 transition-all duration-500 shadow-2xl'>
            <div className='relative z-10 space-y-8'>
              <div className='w-16 h-16 rounded-xl bg-accent flex items-center justify-center text-black shadow-[0_0_40px_rgba(136,255,0,0.3)]'>
                <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2.5'
                    d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-4xl font-black text-white mb-4 tracking-tighter'>Core Template</h2>
                <p className='text-neutral-400 text-lg max-w-sm leading-relaxed'>Manage your master template with version control.</p>
              </div>
            </div>
          </Link>

          <Link href='/workspace' className='group relative overflow-hidden rounded-3xl bg-accent p-8 flex flex-col justify-between hover:scale-[1.02] transition-all duration-500'>
            <div className='space-y-8'>
              <div className='w-16 h-16 rounded-xl bg-black/10 flex items-center justify-center text-black'>
                <svg className='w-9 h-9' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
              </div>
              <h2 className='text-4xl font-black text-black leading-tight tracking-tighter'>
                Job <br />
                Transformer
              </h2>
            </div>
            <div className='mt-12 flex items-center justify-between'>
              <span className='text-[10px] font-black uppercase tracking-[0.3em] text-black/40'>AI Engine Ready</span>
              <div className='w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-black group-hover:translate-x-1 transition-transform'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M9 5l7 7-7 7' />
                </svg>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Recent History ────────────────────────────────────── */}
        {isHydrated && jobs.length > 0 && (
          <section className='space-y-8'>
            <h3 className='text-sm font-black text-white/30 uppercase tracking-[0.4em]'>Recent Targets</h3>

            <div className='grid grid-cols-1 gap-6'>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className='group relative flex flex-col md:flex-row md:items-center justify-between p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] hover:bg-white/[0.06] hover:border-accent/30 transition-all duration-500'>
                  <div className='space-y-2 mb-6 md:mb-0'>
                    <div className='flex items-center gap-4'>
                      <h4 className='text-lg font-semibold text-white tracking-tighter capitalize'>{job.companyName}</h4>
                      <span className='px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/30 uppercase tracking-widest'>
                        {new Date(job.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className='text-sm text-neutral-500 max-w-2xl line-clamp-1 font-medium'>{job.jobDescription}</p>
                  </div>

                  <div className='flex items-center gap-3 self-end md:self-center'>
                    <button
                      onClick={() => handleLoadJob(job)}
                      className='px-8 py-3 text-[10px] font-black uppercase tracking-widest bg-white text-black rounded-xl hover:bg-accent transition-all duration-300 active:scale-95 shadow-xl'>
                      RESTORE
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className='p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all group/del'
                      title='Delete Record'>
                      <svg className='w-5 h-5 transition-transform group-hover/del:scale-110' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2.5'
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
