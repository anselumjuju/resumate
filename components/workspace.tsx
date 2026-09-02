'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LatexEditor } from '@/components/editor/latex-editor';
import { PdfPreview } from '@/components/preview/pdf-preview';
import { compilePdf } from '@/actions/compile-pdf';
import { useGeminiConfig } from '@/hooks/use-gemini-config';
import { DEFAULT_RESUME, DEFAULT_COVER_LETTER } from '@/constants/template';

function WorkspaceInner() {
  const searchParams = useSearchParams();
  const { setIsDirty } = useGeminiConfig();

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
    const tabParam = searchParams.get('tab');
    if (tabParam === 'cover_letter') {
      setActiveTab('cover_letter');
    } else if (tabParam === 'resume') {
      setActiveTab('resume');
    }
  }, [searchParams]);

  useEffect(() => {
    const savedResume = localStorage.getItem('base_resume');
    const savedCL = localStorage.getItem('base_cover_letter');
    setResumeCode(savedResume || DEFAULT_RESUME);
    setClCode(savedCL || DEFAULT_COVER_LETTER);
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
      setIsDirty(false);
    };
  }, [saveStatus, setIsDirty]);

  const handleManualSave = () => saveAndCompile(currentCode, activeTab);

  const handleExport = async () => {
    setIsDownloading(true);
    try {
      const filename = `${activeTab === 'resume' ? 'resume' : 'cover-letter'}-master.pdf`;

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
        <svg className='animate-spin w-4 h-4 text-accent' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
        </svg>
        <span>Loading template…</span>
      </div>
    );
  }

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'unsaved' ? 'Unsaved changes'
    : 'Saved to browser';

  return (
    <div className='flex flex-col h-full w-full bg-[#09090b] overflow-hidden'>
      {/* ── Top Workspace Toolbar ── */}
      <div className='flex items-center justify-between px-6 h-14 border-b border-white/8 bg-[#0c0c0e] shrink-0'>
        <div className='flex items-center gap-4'>
          {/* Tab Pill Selector */}
          <div className='flex bg-white/5 rounded-xl p-1 gap-1 border border-white/5'>
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'resume'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}>
              Master Resume
            </button>
            <button
              onClick={() => setActiveTab('cover_letter')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'cover_letter'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}>
              Cover Letter
            </button>
          </div>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setIsContentOnly(!isContentOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isContentOnly
                ? 'bg-white/5 border-white/10 text-white/70'
                : 'bg-accent/10 border-accent/30 text-accent'
            }`}
            title={isContentOnly ? 'Switch to Full LaTeX Source' : 'Switch to Body Only Focus'}>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16m-7 6h7' />
            </svg>
            <span>{isContentOnly ? 'Body Only' : 'Full LaTeX'}</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className='flex items-center gap-3'>
          {/* Status Indicator */}
          <div className='flex items-center gap-2 px-2 text-xs text-white/40'>
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                saveStatus === 'saved'
                  ? 'bg-green-400'
                  : saveStatus === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-white/20'
              }`}
            />
            <span className='hidden sm:inline'>{saveLabel}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-40'
            title='Force save and recompile'>
            <svg className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            <span className='hidden sm:inline'>Sync</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExport}
            disabled={isDownloading || isLoading}
            className='flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-accent text-black rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40'
            title='Download compiled PDF'>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
            </svg>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ── Split Editor / Preview Layout ── */}
      <main className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
        {/* Left Pane: LaTeX Editor */}
        <section className='flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-white/8 bg-[#0e0e11]'>
          <div className='flex items-center justify-between px-5 h-10 border-b border-white/8 bg-white/1 shrink-0'>
            <div className='flex items-center gap-2'>
              <span className='w-1.5 h-1.5 rounded-full bg-accent' />
              <span className='text-xs font-semibold text-white/50 uppercase tracking-wider'>
                LaTeX Source
              </span>
            </div>
            <span className='text-[11px] text-white/30'>
              {isContentOnly ? 'Editing Body Content' : 'Editing Full Preamble + Document'}
            </span>
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

        {/* Right Pane: Live PDF Preview */}
        <section className='flex-1 flex flex-col overflow-hidden bg-[#09090b]'>
          <div className='flex items-center justify-between px-5 h-10 border-b border-white/8 bg-white/1 shrink-0'>
            <div className='flex items-center gap-2'>
              <span className='w-1.5 h-1.5 rounded-full bg-white/20' />
              <span className='text-xs font-semibold text-white/50 uppercase tracking-wider'>
                Live PDF Preview
              </span>
            </div>
            {isLoading && (
              <span className='text-xs font-medium text-accent flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-accent animate-ping' />
                Compiling…
              </span>
            )}
          </div>

          <div className='flex-1 p-4 lg:p-6 overflow-auto custom-scrollbar flex items-center justify-center'>
            <PdfPreview isLoading={isLoading} error={error} pdfBase64={pdfBase64} />
          </div>
        </section>
      </main>
    </div>
  );
}

export function Workspace() {
  return (
    <Suspense
      fallback={
        <div className='flex-1 flex items-center justify-center gap-2 text-sm text-neutral-400'>
          <svg className='animate-spin w-4 h-4 text-accent' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
          </svg>
          <span>Loading template…</span>
        </div>
      }>
      <WorkspaceInner />
    </Suspense>
  );
}
