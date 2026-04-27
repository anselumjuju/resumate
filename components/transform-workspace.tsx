'use client';

import React, {useState, useEffect} from 'react';
import {PdfPreview} from '@/components/preview/pdf-preview';
import {compilePdf} from '@/actions/compile-pdf';
import {GeminiConfigPanel} from '@/components/ai/gemini-config-panel';
import {useGeminiConfig} from '@/hooks/use-gemini-config';
import {optimizeResumeAction} from '@/actions/optimize-resume';
import {DiffPreview} from '@/components/editor/diff-preview';
import {selectGeminiConfig} from '@/lib/ai-selector';
import {LatexEditor} from '@/components/editor/latex-editor';
import {DEFAULT_COVER_LETTER, DEFAULT_RESUME} from '@/constants/templates';

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
  const {incrementUsage, setIsDirty, keys, activeKeyId, selectedModel, autoSwitch} = useGeminiConfig();

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
  const [letterPdfBase64, setLetterPdfBase64] = useState<string | null>(null);
  const [isCompilingPreview, setIsCompilingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // AI States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{optimizedBody: string; coverLetter: string} | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [previousDraftResume, setPreviousDraftResume] = useState('');
  const [previousDraftCoverLetter, setPreviousDraftCoverLetter] = useState('');

  // Resizable Panels State
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(320);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isContentOnly, setIsContentOnly] = useState(true);
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
    const savedBaseResume = localStorage.getItem('base_resume') || DEFAULT_RESUME;
    const savedBaseCL = localStorage.getItem('base_cover_letter') || DEFAULT_COVER_LETTER;

    if (savedCompany) setCompanyName(savedCompany);
    if (savedJD) setJobDescription(savedJD);
    setBaseResume(savedBaseResume);
    setBaseCoverLetter(savedBaseCL);

    // Always start fresh from base templates
    setDraftResume(savedBaseResume);
    setDraftCoverLetter(savedBaseCL);

    setIsHydrated(true);
  }, []);

  // Save metadata to localStorage when values change
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('target_company', companyName);
    localStorage.setItem('target_jd', jobDescription);
  }, [companyName, jobDescription, isHydrated]);

  // Prevent accidental navigation when changes are present
  useEffect(() => {
    const isResumeModified = draftResume !== baseResume;
    const isCLModified = draftCoverLetter !== baseCoverLetter;
    const dirty = isResumeModified || isCLModified;

    setIsDirty(dirty);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for most browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setIsDirty(false); // Clean up dirty state on unmount
    };
  }, [draftResume, baseResume, draftCoverLetter, baseCoverLetter, setIsDirty]);

  // Compile draft for preview
  useEffect(() => {
    const currentDraft = activeTab === 'resume' ? draftResume : draftCoverLetter;
    if (!isHydrated || !currentDraft) return;

    let isMounted = true;
    const loadPreview = async () => {
      setIsCompilingPreview(true);
      setPreviewError(null);

      const result = await compilePdf(currentDraft);
      if (isMounted) {
        if (result.success && result.pdfBase64) {
          if (activeTab === 'resume') {
            setResumePdfBase64(result.pdfBase64);
          } else {
            setLetterPdfBase64(result.pdfBase64);
          }
        } else {
          setPreviewError(result.error || 'LaTeX Compilation Failed');
        }
        setIsCompilingPreview(false);
      }
    };

    const timer = setTimeout(loadPreview, 500); // Add a small debounce

    return () => {
      isMounted = false;
      clearTimeout(timer);
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
      const sanitizedCompany =
        companyName.trim() ?
          companyName
            .trim()
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase()
        : 'optimized';

      const filePrefix = `anselumjuju-${sanitizedCompany}`;

      if (activeTab === 'resume') {
        // Fallback compile if preview isn't ready
        let pdfData = resumePdfBase64;
        if (!pdfData) {
          const result = await compilePdf(draftResume);
          if (result.success && result.pdfBase64) {
            pdfData = result.pdfBase64;
          } else {
            throw new Error(result.error || 'Compilation failed');
          }
        }

        if (pdfData) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `${filePrefix}-resume.pdf`;
          link.click();
        }
      } else {
        // Handle cover letter export
        const result = await compilePdf(draftCoverLetter);
        if (!result.success || !result.pdfBase64) {
          throw new Error(result.error || 'Cover letter compilation failed');
        }

        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${result.pdfBase64}`;
        link.download = `${filePrefix}-cover-letter.pdf`;
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
      const selection = selectGeminiConfig({keys, activeKeyId, selectedModel, autoSwitch});
      if (!selection.success) {
        alert(selection.error);
        return;
      }

      // 2. Call AI - Use draftResume so manual edits are preserved
      // ALSO use draftCoverLetter so manual edits to CL are preserved
      const result = await optimizeResumeAction(draftResume, jobDescription, selection.config, draftCoverLetter);

      if (result.success && result.optimizedBody && result.coverLetter) {
        // Save current drafts for potential revert
        setPreviousDraftResume(draftResume);
        setPreviousDraftCoverLetter(draftCoverLetter);

        // Update resume draft immediately (in-document) to trigger preview
        const documentMatch = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
        const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
        setDraftResume(`${preamble}\n${result.optimizedBody}\n${post}`);

        // Update cover letter draft immediately
        const clMatch = draftCoverLetter.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
        if (clMatch) {
          setDraftCoverLetter(`${clMatch[1]}\n${result.coverLetter}\n${clMatch[2]}`);
        } else {
          setDraftCoverLetter(result.coverLetter);
        }

        setOptimizationResult({
          optimizedBody: result.optimizedBody,
          coverLetter: result.coverLetter,
        });
        setShowDiff(true);

        // 3. Increment usage (even if success, we used tokens)
        incrementUsage(selection.config.keyId, selection.config.model);
      } else {
        // Still increment usage for the key if we hit an error (tokens were likely consumed)
        incrementUsage(selection.config.keyId, selection.config.model);
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

    // The 'finalBody' is the resolved content from the DiffPreview
    if (activeTab === 'resume') {
      const documentMatch = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
      const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
      setDraftResume(`${preamble}\n${finalBody}\n${post}`);
    } else {
      const clMatch = draftCoverLetter.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
      if (clMatch) {
        setDraftCoverLetter(`${clMatch[1]}\n${finalBody}\n${clMatch[2]}`);
      } else {
        setDraftCoverLetter(finalBody);
      }
    }

    setShowDiff(false);
    setOptimizationResult(null);
    setPreviousDraftResume('');
    setPreviousDraftCoverLetter('');
    alert('AI suggestions applied! (Master template remains untouched)');
  };

  const handleReject = () => {
    // Revert both to previous drafts
    if (previousDraftResume) setDraftResume(previousDraftResume);
    if (previousDraftCoverLetter) setDraftCoverLetter(previousDraftCoverLetter);

    setShowDiff(false);
    setOptimizationResult(null);
    setPreviousDraftResume('');
    setPreviousDraftCoverLetter('');
  };

  const previewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handlePreviewUpdate = (mergedBody: string) => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);

    previewTimeoutRef.current = setTimeout(() => {
      if (activeTab === 'resume') {
        const documentMatch = previousDraftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
        const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
        setDraftResume(`${preamble}\n${mergedBody}\n${post}`);
      } else {
        const documentMatch = previousDraftCoverLetter.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
        if (documentMatch) {
          setDraftCoverLetter(`${documentMatch[1]}\n${mergedBody}\n${documentMatch[2]}`);
        } else {
          setDraftCoverLetter(mergedBody);
        }
      }
    }, 300);
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
                    className='w-full px-4 py-3 bg-white/[0.05] border border-white/[0.07] rounded-xl focus:border-accent/40 focus:bg-white/[0.04] text-base font-semibold tracking-tighter text-white transition-all placeholder:text-white/[0.2] outline-none'
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
                  className='w-full min-h-[400px] px-6 py-6 bg-white/[0.05] border border-white/[0.07] rounded-xl focus:border-accent/40 focus:bg-white/[0.04] text-base font-semibold tracking-tighter text-white transition-all placeholder:text-white/[0.2] outline-none'
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

                {/* Focus Mode Toggle (Only in Editor) */}
                {viewMode === 'editor' && (
                  <button
                    onClick={() => setIsContentOnly(!isContentOnly)}
                    className={`p-2 rounded-lg transition-all ${isContentOnly ? 'bg-accent/10 text-accent' : 'text-white/20 hover:text-white/60'}`}
                    title={isContentOnly ? 'Show Full LaTeX' : 'Focus Mode (Hide Styles)'}>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M4 6h16M4 12h16m-7 6h7' />
                    </svg>
                  </button>
                )}
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
                <div className='h-[40%] shrink-0'>
                  <DiffPreview
                    isVisible={showDiff}
                    original={
                      activeTab === 'resume' ?
                        previousDraftResume.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)?.[1]?.trim() || ''
                      : previousDraftCoverLetter.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)?.[1]?.trim() || previousDraftCoverLetter
                    }
                    updated={activeTab === 'resume' ? optimizationResult.optimizedBody : optimizationResult.coverLetter}
                    onAccept={(finalBody) => handleAccept(finalBody)}
                    onReject={handleReject}
                    onPreviewUpdate={handlePreviewUpdate}
                  />
                </div>

                {/* Bottom: Live PDF Preview */}
                <div className='flex-1 border-t border-white/20 pt-5'>
                  {/* Bottom: Resulting Preview */}
                  <div className='flex-1 h-full rounded-xl overflow-hidden border border-white/5 bg-black'>
                    <PdfPreview isLoading={isCompilingPreview} pdfBase64={activeTab === 'resume' ? resumePdfBase64 : letterPdfBase64} error={previewError} hideControls={true} />
                  </div>
                </div>
              </div>
            : <div className='flex-1 p-5 overflow-auto relative'>
                {viewMode === 'preview' ?
                  <PdfPreview isLoading={isCompilingPreview} pdfBase64={activeTab === 'resume' ? resumePdfBase64 : letterPdfBase64} error={previewError} hideControls={false} />
                : <div className='w-full h-full rounded-xl overflow-hidden border border-white/5 bg-black'>
                    <LatexEditor
                      value={(() => {
                        const raw = activeTab === 'resume' ? draftResume : draftCoverLetter;
                        if (!isContentOnly) return raw;
                        const match = raw.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
                        return match ? match[1].trim() : raw;
                      })()}
                      onChange={(newVal) => {
                        const currentRaw = activeTab === 'resume' ? draftResume : draftCoverLetter;
                        const setter = activeTab === 'resume' ? setDraftResume : setDraftCoverLetter;

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
