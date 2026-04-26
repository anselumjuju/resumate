'use client';

import React, {useState, useEffect} from 'react';
import {LatexEditor} from '@/components/editor/latex-editor';
import {PdfPreview} from '@/components/preview/pdf-preview';
import {compilePdf} from '@/actions/compile-pdf';
import {useGeminiConfig} from '@/hooks/use-gemini-config';

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
  const {setIsDirty} = useGeminiConfig();
  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume');
  const [resumeCode, setResumeCode] = useState('');
  const [clCode, setClCode] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isContentOnly, setIsContentOnly] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const savedResume = localStorage.getItem('base_resume');
    const savedCL = localStorage.getItem('base_cover_letter');
    setResumeCode(savedResume || defaultResume);
    setClCode(savedCL || defaultCoverLetter);
    setIsHydrated(true);
  }, []);

  const currentCode = activeTab === 'resume' ? resumeCode : clCode;

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

  // Prevent accidental navigation when unsaved
  useEffect(() => {
    const dirty = saveStatus === 'unsaved' || saveStatus === 'saving';
    setIsDirty(dirty);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setIsDirty(false); // Clean up dirty state on unmount
    };
  }, [saveStatus, setIsDirty]);

  const handleManualSave = () => saveAndCompile(currentCode, activeTab);

  const handleExport = async () => {
    setIsDownloading(true);
    try {
      const filename = `anselumjuju-master-${activeTab.replace('_', '-')}.pdf`;

      // If we already have a valid PDF base64, use it
      let data = pdfBase64;
      if (!data) {
        const result = await compilePdf(currentCode);
        if (result.success && result.pdfBase64) {
          data = result.pdfBase64;
        } else {
          throw new Error(result.error || 'Compilation failed');
        }
      }

      if (data) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data}`;
        link.download = filename;
        link.click();
      }
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

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

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setIsContentOnly(!isContentOnly)}
            className={`flex items-center gap-2 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border transition-all ${
              isContentOnly ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}
            title={isContentOnly ? 'Show Full Source' : 'Focus Mode (Hide Design Styles)'}>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M4 6h16M4 12h16m-7 6h7' />
            </svg>
            <span>{isContentOnly ? 'Styles Collapsed' : 'Focus Mode'}</span>
          </button>
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
            className='flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 border border-white/10'
            title='Sync to Local Storage'>
            <svg className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='3'
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'></path>
            </svg>
            <span>Sync</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isDownloading || isLoading}
            className='flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-white text-black rounded-xl hover:bg-accent transition-all disabled:opacity-30'
            title='Export as PDF'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'></path>
            </svg>
            <span>Export</span>
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
            <LatexEditor
              value={(() => {
                const raw = activeTab === 'resume' ? resumeCode : clCode;
                if (!isContentOnly) return raw;
                const match = raw.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
                return match ? match[1].trim() : raw;
              })()}
              onChange={(newVal) => {
                const currentRaw = activeTab === 'resume' ? resumeCode : clCode;
                const setter = activeTab === 'resume' ? setResumeCode : setClCode;

                if (!isContentOnly) {
                  setter(newVal);
                  return;
                }

                const match = currentRaw.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
                if (match) {
                  setter(`${match[1]}\n${newVal}\n${match[2]}`);
                } else {
                  setter(newVal);
                }
              }}
            />
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
