'use client';

import React, {useState, useEffect} from 'react';
import {LatexEditor} from '@/components/editor/latex-editor';
import {PdfPreview} from '@/components/preview/pdf-preview';
import {compilePdf} from '@/actions/compile-pdf';

const defaultResume = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}

\\title{\\bf John Doe}
\\author{Software Engineer}
\\date{}

\\begin{document}
\\maketitle

\\section*{Summary}
Experienced software engineer with a passion for building scalable web applications. Focus on clean code, performance, and delivering value to users.

\\section*{Experience}
\\textbf{Senior Developer} \\hfill 2021 - Present \\\\
Company XYZ \\\\
- Led a team of 5 engineers to build a new product resulting in a 30% increase in revenue.
- Architected the transition from monolith to microservices.

\\section*{Education}
\\textbf{B.S. Computer Science} \\hfill 2017 - 2021 \\\\
University of ABC

\\end{document}
`;

const defaultCoverLetter = `\\documentclass[11pt]{letter}
\\usepackage[margin=1in]{geometry}

\\begin{document}
\\begin{letter}{Hiring Manager \\\\ Company Name \\\\ Company Address}
\\opening{Dear Hiring Manager,}

I am writing to express my interest in the [Position Name] position at [Company Name]. With my background in software engineering and my passion for [Industry/Tech], I am confident that I would be a valuable asset to your team.

At my previous role, I [Significant Achievement]. This experience has equipped me with the skills to [Specific Skill/Task].

Thank you for your time and consideration. I look forward to the possibility of discussing how my skills and experience can benefit [Company Name].

\\closing{Sincerely,\\\\John Doe}
\\end{letter}
\\end{document}
`;

export function Workspace() {
  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume');
  const [resumeCode, setResumeCode] = useState('');
  const [clCode, setClCode] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    const savedResume = localStorage.getItem('base_resume');
    const savedCL = localStorage.getItem('base_cover_letter');
    setResumeCode(savedResume || defaultResume);
    setClCode(savedCL || defaultCoverLetter);
    setIsHydrated(true);
  }, []);

  const currentCode = activeTab === 'resume' ? resumeCode : clCode;
  const setCode = activeTab === 'resume' ? setResumeCode : setClCode;

  const saveAndCompile = async (codeToSave: string, tab: 'resume' | 'cover_letter') => {
    setSaveStatus('saving');
    localStorage.setItem(tab === 'resume' ? 'base_resume' : 'base_cover_letter', codeToSave);
    setIsLoading(true);
    setError(null);

    const result = await compilePdf(codeToSave);

    if (result.success && result.pdfBase64) {
      setPdfBase64(result.pdfBase64);
      setError(null);
    } else {
      setPdfBase64(null);
      setError(`${result.error}\n\nLogs:\n${result.logs || 'No logs available'}`);
    }

    setIsLoading(false);
    setSaveStatus('saved');
  };

  // Debounced auto-save
  useEffect(() => {
    if (!isHydrated) return;
    setSaveStatus('unsaved');
    const timer = setTimeout(() => saveAndCompile(currentCode, activeTab), 1500);
    return () => clearTimeout(timer);
  }, [currentCode, activeTab, isHydrated]);

  const handleManualSave = () => saveAndCompile(currentCode, activeTab);

  if (!isHydrated) {
    return (
      <div className='flex-1 flex items-center justify-center gap-2 text-sm text-neutral-400'>
        <svg className='animate-spin w-4 h-4' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
        </svg>
        Loading workspace…
      </div>
    );
  }

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'unsaved' ? 'Unsaved changes'
    : 'Saved';

  return (
    <div className='flex flex-col h-full w-full bg-black'>
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className='flex items-center justify-between px-6 h-14 border-b border-white/20 bg-black/40 backdrop-blur-xl shrink-0'>
        <div className='flex items-center gap-8'>
          <div className='flex items-center gap-2.5'>
            <span className='text-xs font-black uppercase tracking-[0.3em] text-white/40'>Workspace</span>
          </div>

          <div className='flex bg-white/5 rounded-xl p-1 gap-1'>
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'resume' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              Resume
            </button>
            <button
              onClick={() => setActiveTab('cover_letter')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'cover_letter' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'
              }`}>
              Cover Letter
            </button>
          </div>
        </div>

        <div className='flex items-center gap-6'>
          {/* Status indicator */}
          <div className='flex items-center gap-2'>
            <div
              className={[
                'w-2 h-2 rounded-full transition-all duration-500',
                saveStatus === 'saved' ? 'bg-accent shadow-[0_0_10px_var(--accent)]'
                : saveStatus === 'saving' ? 'bg-amber-400 animate-pulse'
                : 'bg-white/10',
              ].join(' ')}
            />
            <span className='text-[10px] font-black uppercase tracking-widest text-white/30'>{saveLabel}</span>
          </div>

          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className='flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-black bg-white rounded-xl hover:bg-accent transition-all duration-300 active:scale-95 disabled:opacity-50'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' />
            </svg>
            Save & Build
          </button>
        </div>
      </div>

      {/* ── Split layout ──────────────────────────────────────── */}
      <main className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
        {/* Left: Editor */}
        <section className='flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-white/20 bg-[#121212]'>
          <div className='flex items-center gap-3 px-6 h-12 border-b border-white/20 bg-white/[0.03] shrink-0 shadow-sm'>
            <div className='w-1.5 h-1.5 rounded-full bg-accent/40' />
            <span className='text-[9px] font-black uppercase tracking-[0.4em] text-white/20'>Source Editor</span>
          </div>
          <div className='flex-1 overflow-hidden'>
            <LatexEditor value={currentCode} onChange={setCode} />
          </div>
        </section>

        {/* Right: PDF Preview */}
        <section className='flex-1 flex flex-col overflow-hidden bg-black'>
          <div className='flex items-center gap-3 px-6 h-12 border-b border-white/20 bg-white/[0.03] shrink-0 shadow-sm'>
            <div className='w-1.5 h-1.5 rounded-full bg-white/10' />
            <span className='text-[9px] font-black uppercase tracking-[0.4em] text-white/20'>Live Artifact</span>
            {isLoading && <span className='ml-auto flex items-center gap-2 text-[9px] font-black text-accent uppercase tracking-widest animate-pulse'>Building…</span>}
          </div>
          <div className='flex-1 p-6 overflow-auto bg-neutral-900/20'>
            <PdfPreview isLoading={isLoading} error={error} pdfBase64={pdfBase64} />
          </div>
        </section>
      </main>
    </div>
  );
}
