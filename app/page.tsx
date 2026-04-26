"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const saved = localStorage.getItem("job_history");
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch {
        console.error("Failed to parse job history");
      }
    }
    setIsHydrated(true);
  }, []);

  const handleLoadJob = (job: SavedJob) => {
    sessionStorage.setItem("target_company", job.companyName);
    sessionStorage.setItem("target_jd", job.jobDescription);
    router.push("/workspace");
  };

  const handleDeleteJob = (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    localStorage.setItem("job_history", JSON.stringify(updated));
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 flex flex-col pt-16 pb-16 md:pt-24 md:pb-24 space-y-14">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h1 className="text-4xl md:text-[2.75rem] font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">
          Craft the perfect resume,<br className="hidden sm:block" /> every time.
        </h1>
        <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
          Keep your LaTeX base template locally. Use AI to tailor it sharply for every job you apply to.
        </p>
      </section>

      {/* ── Primary Actions ────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/editor"
          className="group block p-5 bg-white dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl hover:border-indigo-300/60 dark:hover:border-indigo-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-neutral-600 dark:text-neutral-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <svg className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <h2 className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-100 mb-1">Base Resume</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Edit and compile your core LaTeX template locally.
          </p>
        </Link>

        <Link
          href="/workspace"
          className="group block p-5 bg-white dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800/70 rounded-2xl hover:border-violet-300/60 dark:hover:border-violet-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-500/50"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-neutral-600 dark:text-neutral-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <svg className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <h2 className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-100 mb-1">Job Transformer</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Tailor your resume to a specific job with AI.
          </p>
        </Link>
      </section>

      {/* ── Recent Targets ─────────────────────────────────────── */}
      {isHydrated && jobs.length > 0 && (
        <section className="space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              Recent Targets
            </h3>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
              {jobs.length} saved
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="group flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/50 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-150"
              >
                {/* Info */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {job.companyName || "Unnamed Company"}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500 line-clamp-1 mt-0.5">
                    {job.jobDescription?.slice(0, 80) || "No description"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-neutral-400 font-medium hidden sm:block mr-2 tabular-nums">
                    {new Date(job.timestamp).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleLoadJob(job)}
                    className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-red-500/40"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
