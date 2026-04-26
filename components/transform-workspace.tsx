'use client';

import React, {useState, useEffect} from 'react';
import {PdfPreview} from '@/components/preview/pdf-preview';
import {compilePdf} from '@/actions/compile-pdf';
import {GeminiConfigPanel} from '@/components/ai/gemini-config-panel';
import {useGeminiConfig} from '@/hooks/use-gemini-config';
import {optimizeResumeAction} from '@/actions/optimize-resume';
import {DiffPreview} from '@/components/editor/diff-preview';
import {selectGeminiConfig} from '@/lib/ai-selector';
import {GeminiState} from '@/types/ai';
import {LatexEditor} from '@/components/editor/latex-editor';

const stopWords = new Set([
  'and',
  'the',
  'to',
  'of',
  'a',
  'in',
  'for',
  'is',
  'on',
  'that',
  'by',
  'this',
  'with',
  'i',
  'you',
  'it',
  'not',
  'or',
  'be',
  'are',
  'as',
  'at',
  'from',
  'an',
  'was',
  'we',
  'will',
  'can',
  'your',
  'our',
  'have',
  'has',
  'but',
  'all',
  'any',
  'their',
  'what',
  'which',
  'who',
  'when',
  'where',
  'how',
  'do',
  'does',
  'did',
  'if',
  'then',
  'else',
  'than',
  'about',
  'more',
  'some',
  'such',
  'only',
  'other',
  'these',
  'those',
  'into',
  'over',
  'up',
  'down',
  'out',
  "can't",
  "don't",
  "won't",
  'should',
  'would',
  'could',
  'may',
  'might',
  'must',
  "we're",
  "you're",
  "they're",
  "it's",
  'experience',
  'skills',
  'years',
  'work',
  'team',
  'development',
  'software',
  'role',
  'using',
  'knowledge',
  'ability',
  'working',
  'including',
  'strong',
  'required',
  'related',
  'preferred',
]);

const extractMissingKeywords = (jd: string, resume: string) => {
  if (!jd.trim() || !resume.trim()) return [];

  const cleanJd = jd.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const cleanResume = resume.toLowerCase();

  const jdWords = cleanJd.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  const uniqueJdWords = Array.from(new Set(jdWords));

  const missing = uniqueJdWords.filter((word) => {
    const regex = new RegExp(`\\b${word}\\b`);
    return !regex.test(cleanResume);
  });

  return missing.slice(0, 20); // Top 20 missing keywords
};

export function TransformWorkspace() {
  const geminiConfig = useGeminiConfig();
  const {activeKeyId, incrementUsage} = geminiConfig;

  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Master Templates (from localStorage)
  const [baseResume, setBaseResume] = useState('');
  const [baseCoverLetter, setBaseCoverLetter] = useState('');

  // Job-Specific Drafts (The ones being edited/optimized)
  const [draftResume, setDraftResume] = useState('');
  const [draftCoverLetter, setDraftCoverLetter] = useState('');

  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume');
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
  const [isHydrated, setIsHydrated] = useState(false);

  const [resumePdfBase64, setResumePdfBase64] = useState<string | null>(null);
  const [isCompilingPreview, setIsCompilingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // AI States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{optimizedBody: string; coverLetter: string} | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [previousDraftResume, setPreviousDraftResume] = useState('');

  // Resizable Panels State
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(320);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.min(Math.max(e.clientX, 300), 600);
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 280), 500);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  // Hydrate from sessionStorage and localStorage
  useEffect(() => {
    const savedCompany = localStorage.getItem('target_company');
    const savedJD = localStorage.getItem('target_jd');
    const savedBaseResume = localStorage.getItem('base_resume') || '';
    const savedBaseCL = localStorage.getItem('base_cover_letter') || '';

    // Check for existing drafts first
    const savedDraftResume = localStorage.getItem('job_draft_resume');
    const savedDraftCL = localStorage.getItem('job_draft_cover_letter');

    if (savedCompany) setCompanyName(savedCompany);
    if (savedJD) setJobDescription(savedJD);
    setBaseResume(savedBaseResume);
    setBaseCoverLetter(savedBaseCL);

    // Prioritize existing drafts, otherwise fall back to base
    setDraftResume(savedDraftResume || savedBaseResume);
    setDraftCoverLetter(savedDraftCL || savedBaseCL);

    setIsHydrated(true);
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('target_company', companyName);
    localStorage.setItem('target_jd', jobDescription);
    localStorage.setItem('job_draft_resume', draftResume);
    localStorage.setItem('job_draft_cover_letter', draftCoverLetter);
  }, [companyName, jobDescription, draftResume, draftCoverLetter, isHydrated]);

  // Compile draft for preview
  useEffect(() => {
    const currentDraft = activeTab === 'resume' ? draftResume : draftCoverLetter;
    if (!isHydrated || !currentDraft) return;

    let isMounted = true;
    const loadPreview = async () => {
      setIsCompilingPreview(true);
      const result = await compilePdf(currentDraft);
      if (isMounted && result.success && result.pdfBase64) {
        setResumePdfBase64(result.pdfBase64);
      }
      if (isMounted) setIsCompilingPreview(false);
    };

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [isHydrated, draftResume, draftCoverLetter, activeTab]);

  const handleSaveJob = () => {
    if (!companyName.trim() && !jobDescription.trim()) return;

    const saved = localStorage.getItem('job_history');
    const history = saved ? JSON.parse(saved) : [];

    const newJob = {
      id: crypto.randomUUID(),
      companyName,
      jobDescription,
      timestamp: Date.now(),
    };

    localStorage.setItem('job_history', JSON.stringify([newJob, ...history]));
    alert('Job saved to history!');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filePrefix =
        companyName.trim() ?
          companyName
            .trim()
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
        : 'optimized';

      if (activeTab === 'resume') {
        // Fallback compile if preview isn't ready
        let pdfData = resumePdfBase64;
        if (!pdfData) {
          const result = await compilePdf(draftResume);
          if (result.success && result.pdfBase64) pdfData = result.pdfBase64;
          else throw new Error(result.error || 'Failed to compile resume PDF');
        }

        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = `${filePrefix}_resume.pdf`;
        link.click();
      } else {
        // Cover Letter Download
        let pdfData = resumePdfBase64; // reused for CL when tab is active
        if (!pdfData) {
          const result = await compilePdf(draftCoverLetter);
          if (result.success && result.pdfBase64) pdfData = result.pdfBase64;
          else throw new Error(result.error || 'Failed to compile cover letter PDF');
        }

        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = `${filePrefix}_cover_letter.pdf`;
        link.click();
      }
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOptimize = async () => {
    if (!baseResume || !jobDescription) return;

    setIsOptimizing(true);
    try {
      // 1. Select key/model
      const selection = selectGeminiConfig(geminiConfig as GeminiState);
      if (!selection.success) {
        alert(selection.error);
        return;
      }

      // 2. Call AI - Use draftResume so manual edits are preserved
      const result = await optimizeResumeAction(draftResume, jobDescription, selection.config, baseCoverLetter);

      if (result.success && result.optimizedBody && result.coverLetter) {
        // Save current draft for potential revert
        setPreviousDraftResume(draftResume);

        const documentMatch = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
        const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
        const newLatex = `${preamble}\n${result.optimizedBody}\n${post}`;

        // Update draft immediately to trigger PDF recompile in background
        setDraftResume(newLatex);

        setOptimizationResult({
          optimizedBody: result.optimizedBody,
          coverLetter: result.coverLetter,
        });
        setShowDiff(true);

        // 3. Increment usage
        incrementUsage(selection.config.keyId, selection.config.model);
      } else {
        alert(result.error || 'Optimization failed');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAccept = (finalBody: string) => {
    if (!optimizationResult) return;

    // Use the final merged body from DiffPreview
    const documentMatch = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
    const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
    const newLatex = `${preamble}\n${finalBody}\n${post}`;

    setDraftResume(newLatex);

    // If cover letter was also generated, handle it
    if (optimizationResult.coverLetter) {
      if (baseCoverLetter) {
        // Extract preamble/post from base CL
        const clPreambleMatch = baseCoverLetter.match(/([\s\S]*?)\\begin\{document\}/);
        const clPreamble = clPreambleMatch ? clPreambleMatch[1] : '';
        const clPostMatch = baseCoverLetter.match(/\\end\{document\}([\s\S]*)$/);
        const clPost = clPostMatch ? clPostMatch[1] : '';

        const newCL = `${clPreamble}\\begin{document}\n${optimizationResult.coverLetter}\n\\end{document}${clPost}`;
        setDraftCoverLetter(newCL);
      } else {
        setDraftCoverLetter(optimizationResult.coverLetter);
      }
    }

    setShowDiff(false);
    setOptimizationResult(null);
    setPreviousDraftResume('');
    alert('AI suggestions applied! (Master template remains untouched)');
  };

  const handleReject = () => {
    // Revert to previous draft
    if (previousDraftResume) {
      setDraftResume(previousDraftResume);
    }
    setShowDiff(false);
    setOptimizationResult(null);
    setPreviousDraftResume('');
  };

  const previewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handlePreviewUpdate = (mergedBody: string) => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);

    previewTimeoutRef.current = setTimeout(() => {
      // Update draftResume temporarily to trigger re-compile
      const documentMatch = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
      const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
      const newLatex = `${preamble}\n${mergedBody}\n${post}`;
      setDraftResume(newLatex);
    }, 500);
  };

  const missingKeywords = React.useMemo(() => {
    return extractMissingKeywords(jobDescription, baseResume);
  }, [jobDescription, baseResume]);

  if (!isHydrated) {
    return <div className='flex-1 flex items-center justify-center text-neutral-400'>Loading workspace...</div>;
  }

  return (
    <div className='flex flex-col h-full w-full bg-black'>
      {/* Sub-toolbar */}
      <div className='flex items-center justify-between px-6 h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl shrink-0'>
        <div className='flex items-center gap-4'>
          <span className='text-xs font-black uppercase tracking-[0.3em] text-white/40'>Intelligence</span>
          <span className='px-2.5 py-0.5 rounded-lg text-[9px] uppercase font-black bg-accent/10 text-accent border border-accent/20 tracking-widest'>Neural Flow</span>
        </div>

        <div className='flex items-center gap-4'>
          <button
            onClick={handleSaveJob}
            disabled={!companyName.trim() && !jobDescription.trim()}
            className='px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors disabled:opacity-30'>
            Sync History
          </button>
          <button
            disabled={!activeKeyId || !companyName.trim() || !jobDescription.trim() || isOptimizing}
            onClick={handleOptimize}
            className='flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-black bg-white rounded-xl hover:bg-accent transition-all duration-300 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]'>
            {isOptimizing ?
              <svg className='animate-spin h-3.5 w-3.5 text-black' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3'></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
            : <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M13 10V3L4 14h7v7l9-11h-7z'></path>
              </svg>
            }
            {isOptimizing ? 'Thinking…' : 'Optimize Flow'}
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <main className={`flex-1 flex overflow-hidden relative ${isResizingLeft || isResizingRight ? 'select-none' : ''}`}>
        {/* Resize Overlay to catch mouse events over iframes */}
        {(isResizingLeft || isResizingRight) && <div className='absolute inset-0 z-50 cursor-col-resize' />}
        {/* ── Left Panel: Job Context ── */}
        <section
          style={{width: isLeftCollapsed ? '48px' : `${leftWidth}px`}}
          className={`shrink-0 border-r border-white/20 flex flex-col overflow-hidden bg-black ${isResizingLeft ? '' : 'transition-[width] duration-500 ease-in-out'}`}>
          {/* Panel header */}
          <div className='px-6 h-12 border-b border-white/20 bg-white/[0.03] shrink-0 flex items-center justify-between shadow-sm'>
            {!isLeftCollapsed && (
              <div className='flex items-center gap-3'>
                <div className='w-1.5 h-1.5 rounded-full bg-white/20' />
                <span className='text-[9px] font-black uppercase tracking-[0.4em] text-white/20'>Opportunity Graph</span>
              </div>
            )}
            <button onClick={() => setIsLeftCollapsed(!isLeftCollapsed)} className='p-1.5 hover:bg-white/5 rounded-lg transition-colors'>
              <svg className={`w-4 h-4 text-white/20 transition-transform ${isLeftCollapsed ? 'rotate-0' : 'rotate-180'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>

          {!isLeftCollapsed && (
            <div className='flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10'>
            {/* Company Name */}
            <div className='space-y-4'>
              <label htmlFor='companyName' className='block text-[10px] font-black text-white/20 uppercase tracking-[0.2em]'>
                Target Company
              </label>
              <div className='relative group'>
                <input
                  id='companyName'
                  type='text'
                  placeholder='Entity name…'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className='w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl focus:border-accent/40 focus:bg-white/[0.04] text-base font-semibold tracking-tighter text-white transition-all placeholder:text-white/5 outline-none'
                />
                <div className='absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity' />
              </div>
            </div>

            {/* Job Description */}
            <div className='flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <label htmlFor='jobDescription' className='block text-[10px] font-black text-white/20 uppercase tracking-[0.2em]'>
                  System Constraints
                </label>
                {jobDescription.length > 0 && (
                  <span className='text-[10px] font-black text-accent tabular-nums uppercase tracking-widest'>{jobDescription.split(/\s+/).filter(Boolean).length} Tokens</span>
                )}
              </div>
              <textarea
                id='jobDescription'
                placeholder='Paste raw data here…'
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className='w-full min-h-[400px] px-6 py-6 bg-white/[0.02] border border-white/5 rounded-xl focus:border-accent/40 focus:bg-white/[0.04] text-sm leading-relaxed text-white/80 resize-none transition-all placeholder:text-white/10 outline-none'
              />
            </div>

            {/* Keyword Analysis */}
            {missingKeywords.length > 0 && (
              <div className='p-6 rounded-xl bg-accent/5 border border-accent/10'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-1.5 h-1.5 rounded-full bg-accent animate-pulse' />
                  <p className='text-[10px] font-black text-accent uppercase tracking-widest'>Optimization Gaps</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {missingKeywords.map((word) => (
                    <span key={word} className='px-2.5 py-1 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5'>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Left Resizer */}
      {!isLeftCollapsed && (
        <div
          onMouseDown={() => setIsResizingLeft(true)}
          className={`w-1.5 h-full cursor-col-resize transition-all z-30 shrink-0 -mx-0.5 group/resizer relative ${isResizingLeft ? 'bg-accent/40' : 'hover:bg-white/5'}`}>
          <div
            className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] transition-colors ${isResizingLeft ? 'bg-accent' : 'bg-white/10 group-hover/resizer:bg-accent/40'}`}
          />
        </div>
      )}

        {/* ── Center Panel: Preview/Editor ── */}
        <section className='flex-1 flex flex-col overflow-hidden bg-black relative'>
          {/* Tab Header */}
          <div className='px-6 h-12 border-b border-white/20 bg-white/[0.03] backdrop-blur-xl shrink-0 flex items-center justify-between gap-4 shadow-sm'>
            <div className='flex items-center gap-6'>
              <div className='flex items-center gap-4'>
                <div className='flex bg-white/5 rounded-xl p-1 gap-1'>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'resume' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'}`}>
                    Resume
                  </button>
                  <button
                    onClick={() => setActiveTab('cover_letter')}
                    className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'cover_letter' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/70'}`}>
                    Letter
                  </button>
                </div>

                {/* Status Chip */}
                {showDiff ?
                  <span className='flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent text-[9px] font-black rounded-lg border border-accent/20 animate-pulse uppercase tracking-widest'>
                    In Review
                  </span>
                : draftResume !== baseResume ?
                  <span className='flex items-center gap-2 px-3 py-1 bg-white/5 text-white/40 text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-widest'>
                    Modified
                  </span>
                : null}
              </div>

              {/* View Mode Switcher */}
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'preview' ? 'bg-white/10 text-accent' : 'text-white/20 hover:text-white/60'}`}
                  title='Visual Preview'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'></path>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2.5'
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'></path>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('editor')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'editor' ? 'bg-white/10 text-accent' : 'text-white/20 hover:text-white/60'}`}
                  title='Code Editor'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2.5'
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || isCompilingPreview}
              className='flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-white text-black rounded-xl hover:bg-accent transition-all duration-300 disabled:opacity-30'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'></path>
              </svg>
              <span>Export</span>
            </button>
          </div>

          {/* Preview/Editor area */}
          <div className='flex-1 flex flex-col overflow-hidden'>
            {optimizationResult && showDiff ?
              <div className='flex-1 flex flex-col overflow-hidden p-5 gap-5'>
                {/* Top: Diff Review (Flexible height) */}
                <div className='h-[45%] shrink-0'>
                  <DiffPreview
                    isVisible={showDiff}
                    original={previousDraftResume.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)?.[1]?.trim() || ''}
                    updated={optimizationResult.optimizedBody}
                    onAccept={(finalBody) => handleAccept(finalBody)}
                    onReject={handleReject}
                    onPreviewUpdate={handlePreviewUpdate}
                  />
                </div>

                {/* Bottom: Live PDF Preview */}
                <div className='flex-1 border-t border-white/20 pt-5'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>Live Preview</span>
                    <span className='text-[10px] text-neutral-500 italic'>Updates after you Apply changes</span>
                  </div>
                  <PdfPreview isLoading={isCompilingPreview} pdfBase64={resumePdfBase64} hideControls={true} />
                </div>
              </div>
            : <div className='flex-1 p-5 overflow-auto relative'>
                {viewMode === 'preview' ?
                  <PdfPreview isLoading={isCompilingPreview} pdfBase64={resumePdfBase64} hideControls={false} />
                : <div className='w-full h-full rounded-xl overflow-hidden border border-white/5 bg-black'>
                    <LatexEditor value={activeTab === 'resume' ? draftResume : draftCoverLetter} onChange={activeTab === 'resume' ? setDraftResume : setDraftCoverLetter} />
                  </div>
                }
              </div>
            }
          </div>
        </section>

        {/* Right Resizer */}
        {/* Right Resizer */}
        {!isRightCollapsed && (
          <div
            onMouseDown={() => setIsResizingRight(true)}
            className={`w-1.5 h-full cursor-col-resize transition-all z-30 shrink-0 -mx-0.5 group/resizer relative ${isResizingRight ? 'bg-accent/40' : 'hover:bg-white/5'}`}>
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] transition-colors ${isResizingRight ? 'bg-accent' : 'bg-white/10 group-hover/resizer:bg-accent/40'}`}
            />
          </div>
        )}

        {/* ── Right Panel: AI Config ── */}
        <section
          style={{width: isRightCollapsed ? '48px' : `${rightWidth}px`}}
          className={`shrink-0 border-l border-white/20 flex flex-col overflow-hidden bg-black ${isResizingRight ? '' : 'transition-[width] duration-500 ease-in-out'} ${isResizingLeft || isResizingRight ? 'select-none' : ''}`}>
          {/* Sidebar Toggle */}
          <div className='flex items-center justify-between px-6 h-12 border-b border-white/20 bg-white/[0.03] shadow-sm'>
            {!isRightCollapsed && (
              <div className='flex items-center gap-3'>
                <div className='w-1.5 h-1.5 rounded-full bg-accent' />
                <span className='text-[9px] font-black text-white/40 uppercase tracking-[0.2em]'>Neural Interface</span>
              </div>
            )}
            <button onClick={() => setIsRightCollapsed(!isRightCollapsed)} className='p-1.5 hover:bg-white/5 rounded-lg transition-colors ml-auto'>
              <svg className={`w-4 h-4 text-white/20 transition-transform ${isRightCollapsed ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>

          {!isRightCollapsed && (
            <div className='flex-1 overflow-y-auto p-6 custom-scrollbar space-y-12 bg-black'>
              <GeminiConfigPanel />

              <div className='p-6 rounded-xl bg-white/[0.02] border border-white/5'>
                <h4 className='text-[10px] font-black text-white/40 uppercase tracking-widest mb-4'>Protocol Heuristics</h4>
                <p className='text-[11px] text-white/20 leading-relaxed font-medium'>
                  Optimization focuses on semantic alignment between your profile and target constraints. Master templates remain immutable throughout the process.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
