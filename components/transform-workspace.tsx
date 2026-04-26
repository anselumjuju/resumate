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
  const [optimizationResult, setOptimizationResult] = useState<{ optimizedBody: string; coverLetter: string } | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [previousDraftResume, setPreviousDraftResume] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');

  // Resizable Panels State
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(320);
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
          coverLetter: result.coverLetter
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
    <div className='flex flex-col h-full w-full'>
      {/* Sub-toolbar */}
      <div className='flex items-center justify-between px-6 py-2.5 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0'>
        <div className='flex items-center gap-3'>
          <span className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>Target Opportunity</span>
          <span className='px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40'>
            AI Workflow
          </span>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={handleSaveJob}
            disabled={!companyName.trim() && !jobDescription.trim()}
            className='px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'>
            Save to History
          </button>
          <button
            disabled={!activeKeyId || !companyName.trim() || !jobDescription.trim() || isOptimizing}
            onClick={handleOptimize}
            title={activeKeyId ? 'Optimize with AI' : 'Add Gemini API Key to enable optimization'}
            className='flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'>
            {isOptimizing ? (
              <svg className='animate-spin h-3.5 w-3.5 text-white' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3'></circle>
                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
            ) : (
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z'></path>
              </svg>
            )}
            {isOptimizing ? 'Optimizing…' : 'Optimize with AI'}
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <main className='flex-1 flex overflow-hidden bg-neutral-50 dark:bg-[#050505] relative'>
        {/* ── Left Panel: Job Context ── */}
        <section 
          style={{ width: `${leftWidth}px` }}
          className='shrink-0 border-r border-neutral-200/60 dark:border-neutral-800/60 flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0a]'
        >
          {/* Panel header */}
          <div className='px-6 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/80 dark:bg-neutral-900/20 shrink-0 flex items-center gap-3'>
            <div className='p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0'>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className='text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5'>Step 1</p>
              <h2 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100'>Target Opportunity</h2>
            </div>
          </div>

          {/* Scrollable form area */}
          <div className='flex-1 overflow-y-auto custom-scrollbar'>
            {/* Company Name */}
            <div className='px-6 pt-6 pb-5 border-b border-neutral-100 dark:border-neutral-800/40'>
              <label htmlFor='companyName' className='block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3'>
                Target Company
              </label>
              <input
                id='companyName'
                type='text'
                placeholder='e.g. Stripe, Vercel, Linear…'
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className='w-full px-0 py-1.5 bg-transparent border-b-2 border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors duration-150 placeholder:text-neutral-300 dark:placeholder:text-neutral-700'
              />
            </div>

            {/* Job Description */}
            <div className='px-6 pt-5 pb-5 flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <label htmlFor='jobDescription' className='block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest'>
                  Job Description
                </label>
                {jobDescription.length > 0 && <span className='text-[10px] text-neutral-400 tabular-nums'>{jobDescription.split(/\s+/).filter(Boolean).length} words</span>}
              </div>
              <textarea
                id='jobDescription'
                placeholder='Paste the full job description here.'
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className='w-full min-h-[400px] px-4 py-3.5 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/60 dark:focus:border-indigo-500/50 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 resize-none transition-all duration-200 placeholder:text-neutral-400/60 dark:placeholder:text-neutral-600'
              />
            </div>

            {/* Keyword Analysis */}
            {missingKeywords.length > 0 && (
              <div className='mx-6 mb-6 p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='relative flex h-2 w-2 shrink-0'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-violet-500'></span>
                  </span>
                  <p className='text-xs font-semibold text-violet-900 dark:text-violet-200'>{missingKeywords.length} keywords missing</p>
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {missingKeywords.map((word) => (
                    <span
                      key={word}
                      className='px-2 py-0.5 bg-white dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[11px] font-medium rounded-md border border-violet-200/60 dark:border-violet-700/40'>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Left Resizer */}
        <div 
          onMouseDown={() => setIsResizingLeft(true)}
          className='w-1 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-30 shrink-0'
        />

        {/* ── Center Panel: Preview/Editor ── */}
        <section className='flex-1 flex flex-col overflow-hidden bg-neutral-50/50 dark:bg-[#080808]'>
          {/* Tab Header */}
          <div className='px-6 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm shrink-0 flex items-center justify-between gap-4'>
            <div className='flex items-center gap-6'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0'>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <p className='text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5'>Step 2</p>
                  <div className='flex items-center gap-3'>
                    <div className='flex bg-neutral-100 dark:bg-neutral-800/80 rounded-lg p-0.5 gap-0.5'>
                      <button
                        onClick={() => setActiveTab('resume')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === 'resume' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>Resume</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('cover_letter')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === 'cover_letter' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span>Letter</span>
                      </button>
                    </div>

                    {/* Status Chip */}
                    {showDiff ? (
                      <span className='flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200/50 dark:border-amber-800/30 animate-pulse'>
                        <span className='w-1.5 h-1.5 rounded-full bg-amber-500'></span>
                        AI REVIEW
                      </span>
                    ) : draftResume !== baseResume ? (
                      <span className='flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-200/50 dark:border-indigo-800/30'>
                        <span className='w-1.5 h-1.5 rounded-full bg-indigo-500'></span>
                        OPTIMIZED
                      </span>
                    ) : (
                      <span className='flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 dark:bg-neutral-900/30 text-neutral-400 text-[10px] font-bold rounded-full border border-neutral-200/50 dark:border-neutral-800/30'>
                        BASE TEMPLATE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className='flex items-center gap-2 pt-4'>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                  title='Preview PDF'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'></path>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'></path>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('editor')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'editor' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                  title='Edit LaTeX'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || isCompilingPreview}
              className='shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'></path>
              </svg>
              <span>Download PDF</span>
            </button>
          </div>

          {/* Preview/Editor area */}
          <div className='flex-1 flex flex-col overflow-hidden'>
            {optimizationResult && showDiff ? (
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
                <div className='flex-1 border-t-2 border-dashed border-neutral-200 dark:border-neutral-800 pt-5'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-[10px] font-bold text-neutral-400 uppercase tracking-widest'>Live Preview</span>
                    <span className='text-[10px] text-neutral-500 italic'>Updates after you Apply changes</span>
                  </div>
                  <PdfPreview 
                    isLoading={isCompilingPreview} 
                    pdfBase64={resumePdfBase64} 
                    hideControls={true}
                  />
                </div>
              </div>
            ) : (
              <div className='flex-1 p-5 overflow-auto relative'>
                {viewMode === 'preview' ? (
                  <PdfPreview 
                    isLoading={isCompilingPreview} 
                    pdfBase64={resumePdfBase64} 
                    hideControls={false}
                  />
                ) : (
                  <div className='w-full h-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[#1e1e1e]'>
                    <LatexEditor
                      value={activeTab === 'resume' ? draftResume : draftCoverLetter}
                      onChange={activeTab === 'resume' ? setDraftResume : setDraftCoverLetter}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Resizer */}
        {!isRightCollapsed && (
          <div 
            onMouseDown={() => setIsResizingRight(true)}
            className='w-1 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-30 shrink-0'
          />
        )}

        {/* ── Right Panel: AI Config (Moved to complete right) ── */}
        <section 
          style={{ width: isRightCollapsed ? '48px' : `${rightWidth}px` }}
          className='shrink-0 border-l border-neutral-200/60 dark:border-neutral-800/60 flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0a] transition-[width] duration-300 ease-in-out'
        >
          {/* Sidebar Toggle */}
          <div className='flex items-center justify-between p-3 border-b border-neutral-100 dark:border-neutral-800/40 bg-neutral-50/50 dark:bg-neutral-900/20'>
            {!isRightCollapsed && (
              <div className='flex items-center gap-2'>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
                </svg>
                <span className='text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest'>AI Assistant</span>
              </div>
            )}
            <button 
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className='p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors ml-auto'
            >
              <svg className={`w-4 h-4 text-neutral-500 transition-transform ${isRightCollapsed ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>

          {!isRightCollapsed && (
            <div className='flex-1 overflow-y-auto p-4 custom-scrollbar'>
              <GeminiConfigPanel />
              
              {/* Optional: Add AI-related context or hints here */}
              <div className='mt-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/40'>
                <h4 className='text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-tight mb-2'>Usage Tips</h4>
                <p className='text-[11px] text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed'>
                  Optimizing your resume with Gemini will focus on the Summary, Skills, and Projects sections to match the provided job description.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
