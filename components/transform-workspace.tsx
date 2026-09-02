'use client';

import React, { useState, useEffect } from 'react';
import { PdfPreview } from '@/components/preview/pdf-preview';
import { compilePdf } from '@/actions/compile-pdf';
import { GeminiConfigPanel } from '@/components/ai/gemini-config-panel';
import { CandidateProfilePanel } from '@/components/profile/candidate-profile-panel';
import { useGeminiConfig } from '@/hooks/use-gemini-config';
import { useCandidateProfile } from '@/hooks/use-candidate-profile';
import { optimizeResumeAction, analyzeJobAlignmentAction, AnalysisResult } from '@/actions/optimize-resume';
import { DiffPreview } from '@/components/editor/diff-preview';
import { selectGeminiConfig } from '@/lib/ai-selector';
import { LatexEditor } from '@/components/editor/latex-editor';
import { DEFAULT_COVER_LETTER, DEFAULT_RESUME } from '@/constants/template';

export function TransformWorkspace() {
  const { incrementUsage, setIsDirty, keys, activeKeyId, selectedModel, autoSwitch } = useGeminiConfig();
  const { profile } = useCandidateProfile();

  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Master Templates
  const [baseResume, setBaseResume] = useState('');
  const [baseCoverLetter, setBaseCoverLetter] = useState('');

  // Job-Specific Drafts
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

  // Workflow & AI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{ optimizedBody: string; coverLetter: string } | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [previousDraftResume, setPreviousDraftResume] = useState('');
  const [previousDraftCoverLetter, setPreviousDraftCoverLetter] = useState('');

  // Resizable Panels State
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(360);
  const [rightPanelTab, setRightPanelTab] = useState<'profile' | 'ai'>('profile');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true); // Default collapsed for clean spacious view
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
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 280), 480);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  // Load Initial Templates and Session Jobs
  useEffect(() => {
    const savedResume = localStorage.getItem('base_resume');
    const savedCL = localStorage.getItem('base_cover_letter');
    const defaultRes = savedResume || DEFAULT_RESUME;
    const defaultCL = savedCL || DEFAULT_COVER_LETTER;

    setBaseResume(defaultRes);
    setBaseCoverLetter(defaultCL);
    setDraftResume(defaultRes);
    setDraftCoverLetter(defaultCL);

    const sessionCompany = sessionStorage.getItem('target_company');
    const sessionJd = sessionStorage.getItem('target_jd');
    if (sessionCompany) setCompanyName(sessionCompany);
    if (sessionJd) setJobDescription(sessionJd);

    setIsHydrated(true);
  }, []);

  // Track Unsaved Changes
  useEffect(() => {
    if (!isHydrated) return;
    const hasUnsavedChanges =
      draftResume !== baseResume ||
      draftCoverLetter !== baseCoverLetter ||
      companyName !== '' ||
      jobDescription !== '';
    setIsDirty(hasUnsavedChanges);
  }, [draftResume, draftCoverLetter, baseResume, baseCoverLetter, companyName, jobDescription, isHydrated, setIsDirty]);

  // Debounced Live PDF Compilation
  useEffect(() => {
    if (!isHydrated) return;

    let isMounted = true;
    const currentDraft = activeTab === 'resume' ? draftResume : draftCoverLetter;

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

    const timer = setTimeout(loadPreview, 500);

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
    alert('Target saved to history!');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const sanitizedCompany =
        companyName.trim()
          ? companyName
              .trim()
              .replace(/[^a-z0-9]/gi, '-')
              .toLowerCase()
          : 'tailored';

      const filePrefix = `resume-${sanitizedCompany}`;

      if (activeTab === 'resume') {
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

  // Step 3: Analyze Match
  const handleAnalyzeFit = async () => {
    if (!draftResume || !jobDescription.trim()) {
      alert('Please provide a Job Description to analyze match.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const selection = selectGeminiConfig({ keys, activeKeyId, selectedModel, autoSwitch });
      if (!selection.success) {
        alert(selection.error);
        return;
      }

      const result = await analyzeJobAlignmentAction(draftResume, jobDescription, selection.config, profile);
      if (result.success) {
        setAnalysisResult(result);
        incrementUsage(selection.config.keyId, selection.config.model);
      } else {
        alert(result.error || 'Failed to analyze job alignment.');
      }
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 4: Tailor Resume
  const handleTailorResume = async () => {
    if (!draftResume || !jobDescription.trim()) return;

    setIsOptimizing(true);
    try {
      const selection = selectGeminiConfig({ keys, activeKeyId, selectedModel, autoSwitch });
      if (!selection.success) {
        alert(selection.error);
        return;
      }

      const result = await optimizeResumeAction(draftResume, jobDescription, selection.config, draftCoverLetter, profile);

      if (result.success && result.optimizedBody && result.coverLetter) {
        setPreviousDraftResume(draftResume);
        setPreviousDraftCoverLetter(draftCoverLetter);

        // Splice optimized body into resume
        const documentMatch = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
        const [preamble, post] = [documentMatch?.[1] || '', documentMatch?.[2] || ''];
        setDraftResume(`${preamble}\n${result.optimizedBody}\n${post}`);

        // Splice optimized body into cover letter
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
        incrementUsage(selection.config.keyId, selection.config.model);
      } else {
        incrementUsage(selection.config.keyId, selection.config.model);
        alert(result.error || 'Tailoring optimization failed');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAccept = (finalBody: string) => {
    if (!optimizationResult) return;

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
  };

  const handleReject = () => {
    if (previousDraftResume) setDraftResume(previousDraftResume);
    if (previousDraftCoverLetter) setDraftCoverLetter(previousDraftCoverLetter);

    setShowDiff(false);
    setOptimizationResult(null);
    setPreviousDraftResume('');
    setPreviousDraftCoverLetter('');
  };

  const currentPreviewPdf = activeTab === 'resume' ? resumePdfBase64 : letterPdfBase64;
  const currentCode = activeTab === 'resume' ? draftResume : draftCoverLetter;

  // Derive workflow step for the header indicator
  const currentStepNumber: number = (currentPreviewPdf && !showDiff && analysisResult) ? 6 : showDiff ? 5 : analysisResult ? 4 : jobDescription.trim() ? 3 : 2;

  return (
    <div className='flex flex-col h-full w-full bg-[#09090b] overflow-hidden select-none'>
      {/* ── Workflow Progress & Top Bar ── */}
      <div className='px-6 h-14 border-b border-white/8 bg-[#0c0c0e] shrink-0 flex items-center justify-between gap-4'>
        {/* Title and Step Guidance */}
        <div className='flex items-center gap-3 min-w-0'>
          <h2 className='text-sm font-bold text-white tracking-tight shrink-0'>
            Tailor to Job
          </h2>

          <div className='hidden sm:flex items-center gap-2 text-xs text-white/40 pl-3 border-l border-white/8'>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              currentStepNumber >= 4 ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-white/60'
            }`}>
              Step {currentStepNumber} of 6
            </span>
            <span className='truncate text-white/60'>
              {currentStepNumber === 2 && 'Paste Job Description'}
              {currentStepNumber === 3 && 'Ready to Analyze Match'}
              {currentStepNumber === 4 && 'Match Analyzed → Tailor Resume'}
              {currentStepNumber === 5 && 'Review AI Diff'}
              {currentStepNumber === 6 && 'Ready to Export PDF'}
            </span>
          </div>
        </div>

        {/* Workflow Actions */}
        <div className='flex items-center gap-2 shrink-0'>
          <button
            onClick={handleSaveJob}
            disabled={!companyName.trim() && !jobDescription.trim()}
            className='hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all disabled:opacity-20'
            title='Save target to recent history'>
            Save Target
          </button>

          {!analysisResult ? (
            <button
              onClick={handleAnalyzeFit}
              disabled={isAnalyzing || !jobDescription.trim()}
              className='flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-accent text-black rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30'>
              {isAnalyzing ? (
                <>
                  <div className='w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin' />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <span>Analyze Match</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleTailorResume}
              disabled={isOptimizing}
              className='flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-accent text-black rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30'>
              {isOptimizing ? (
                <>
                  <div className='w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin' />
                  <span>Tailoring…</span>
                </>
              ) : (
                <>
                  <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M13 10V3L4 14h7v7l9-11h-7z' />
                  </svg>
                  <span>Tailor Resume</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={isDownloading || !currentPreviewPdf}
            className='flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white text-black rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-30'>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
            </svg>
            <span>Export</span>
          </button>

          {/* Toggle Inspector / Helper Panel */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`p-2 rounded-lg border transition-all ${
              !isRightCollapsed ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
            title='Toggle Profile & AI Inspector'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16m-7 6h7' />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Main Multi-Pane Content ── */}
      <main className={`flex-1 flex overflow-hidden relative ${isResizingLeft || isResizingRight ? 'select-none' : ''}`}>
        {(isResizingLeft || isResizingRight) && <div className='absolute inset-0 z-50 cursor-col-resize' />}

        {/* ── Left Pane: Job Input & Match Analysis ── */}
        <section
          style={{ width: isLeftCollapsed ? '44px' : `${leftWidth}px` }}
          className={`shrink-0 border-r border-white/8 flex flex-col overflow-hidden bg-[#0c0c0e] ${
            isResizingLeft ? '' : 'transition-[width] duration-300 ease-in-out'
          }`}>
          {/* Header */}
          <div className='px-4 h-10 border-b border-white/8 bg-white/[0.01] shrink-0 flex items-center justify-between'>
            {!isLeftCollapsed && (
              <span className='text-xs font-semibold text-white/50 uppercase tracking-wider'>
                Target Job Description
              </span>
            )}
            <button
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              className='p-1 hover:bg-white/5 rounded transition-colors ml-auto text-white/30 hover:text-white'
              title={isLeftCollapsed ? 'Expand Job Panel' : 'Collapse Job Panel'}>
              <svg className={`w-4 h-4 transition-transform ${isLeftCollapsed ? 'rotate-0' : 'rotate-180'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
              </svg>
            </button>
          </div>

          {!isLeftCollapsed && (
            <div className='flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5'>
              {/* Target Company */}
              <div className='space-y-1.5'>
                <label htmlFor='companyName' className='block text-xs font-semibold text-white/60'>
                  Company / Role Name
                </label>
                <input
                  id='companyName'
                  type='text'
                  placeholder='e.g. Stripe, Senior Frontend Engineer…'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className='w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 focus:bg-white/10 text-xs font-medium text-white transition-all placeholder:text-white/20 outline-none'
                />
              </div>

              {/* Job Description Textarea */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <label htmlFor='jobDescription' className='block text-xs font-semibold text-white/60'>
                    Job Description
                  </label>
                  {jobDescription.length > 0 && (
                    <span className='text-[10px] text-accent font-bold tabular-nums'>
                      {jobDescription.split(/\s+/).filter(Boolean).length} Words
                    </span>
                  )}
                </div>
                <textarea
                  id='jobDescription'
                  placeholder='Paste the full job description requirements here…'
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (analysisResult) setAnalysisResult(null);
                  }}
                  rows={8}
                  className='w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 focus:bg-white/10 text-xs font-mono text-white/90 transition-all placeholder:text-white/20 outline-none resize-y custom-scrollbar leading-relaxed'
                />
              </div>

              {/* ── AI Match Analysis Output Card ── */}
              {analysisResult && (
                <div className='p-4 rounded-xl bg-[#121215] border border-white/10 space-y-4 animate-in fade-in duration-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-accent animate-pulse' />
                      <h4 className='text-xs font-bold text-white uppercase tracking-wider'>
                        Match Analysis
                      </h4>
                    </div>
                    <button
                      onClick={handleAnalyzeFit}
                      disabled={isAnalyzing}
                      className='text-[11px] text-white/40 hover:text-white underline font-medium'>
                      Re-analyze
                    </button>
                  </div>

                  {analysisResult.summary && (
                    <p className='text-xs text-white/75 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5'>
                      {analysisResult.summary}
                    </p>
                  )}

                  {/* Verified Matching Skills */}
                  <div className='space-y-1.5'>
                    <span className='text-[10px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1'>
                      <span>✓</span> Verified Matches ({analysisResult.matchingSkills.length})
                    </span>
                    <div className='flex flex-wrap gap-1.5'>
                      {analysisResult.matchingSkills.map((s) => (
                        <span key={s} className='px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-300 text-[11px] font-medium'>
                          {s}
                        </span>
                      ))}
                      {analysisResult.matchingSkills.length === 0 && (
                        <span className='text-xs text-white/30 italic'>No direct matches detected.</span>
                      )}
                    </div>
                  </div>

                  {/* Safe Inferred Skills */}
                  {analysisResult.safeInferredSkills.length > 0 && (
                    <div className='space-y-1.5'>
                      <span className='text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1'>
                        <span>✦</span> Safe Inferences ({analysisResult.safeInferredSkills.length})
                      </span>
                      <div className='flex flex-wrap gap-1.5'>
                        {analysisResult.safeInferredSkills.map((inf, idx) => (
                          <span
                            key={idx}
                            title={inf.reason || `Inferred from ${inf.source}`}
                            className='px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium flex items-center gap-1'>
                            <span>{inf.source} → {inf.implied}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guarded / Unsupported Skills */}
                  {analysisResult.unsupportedSkills.length > 0 && (
                    <div className='space-y-1.5 pt-2 border-t border-white/5'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[10px] font-bold text-amber-400 uppercase tracking-wider'>
                          ⚠️ Guarded ({analysisResult.unsupportedSkills.length})
                        </span>
                        <span className='text-[9px] text-amber-300/80 bg-amber-500/10 px-1.5 py-0.2 rounded'>
                          Will Not Fabricate
                        </span>
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {analysisResult.unsupportedSkills.map((s) => (
                          <span key={s} className='px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300/70 text-[11px] line-through decoration-amber-500/40'>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tailor CTA */}
                  <button
                    onClick={handleTailorResume}
                    disabled={isOptimizing}
                    className='w-full py-2.5 bg-accent text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2'>
                    {isOptimizing ? (
                      <>
                        <div className='w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin' />
                        <span>Generating Tailored Draft…</span>
                      </>
                    ) : (
                      <span>Proceed to Tailor Resume →</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Left Resizer */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={() => setIsResizingLeft(true)}
            className={`w-1.5 h-full cursor-col-resize z-30 shrink-0 relative transition-all ${
              isResizingLeft ? 'bg-accent/40' : 'hover:bg-white/10'
            }`}>
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px ${isResizingLeft ? 'bg-accent' : 'bg-white/10'}`} />
          </div>
        )}

        {/* ── Center Pane: Preview / Diff / Editor ── */}
        <section className='flex-1 flex flex-col overflow-hidden bg-[#09090b] relative'>
          {/* Center Header Tabs */}
          <div className='px-5 h-10 border-b border-white/8 bg-white/[0.01] shrink-0 flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div className='flex bg-white/5 rounded-lg p-0.5 gap-0.5 border border-white/5'>
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'resume' ? 'bg-accent text-black shadow-sm' : 'text-white/40 hover:text-white'
                  }`}>
                  Resume
                </button>
                <button
                  onClick={() => setActiveTab('cover_letter')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'cover_letter' ? 'bg-accent text-black shadow-sm' : 'text-white/40 hover:text-white'
                  }`}>
                  Cover Letter
                </button>
              </div>

              {!showDiff && (
                <div className='flex items-center bg-white/5 rounded-lg p-0.5 gap-0.5 border border-white/5'>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      viewMode === 'preview' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/70'
                    }`}>
                    PDF Preview
                  </button>
                  <button
                    onClick={() => setViewMode('editor')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      viewMode === 'editor' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/70'
                    }`}>
                    LaTeX Code
                  </button>
                </div>
              )}
            </div>

            {viewMode === 'editor' && !showDiff && (
              <button
                onClick={() => setIsContentOnly(!isContentOnly)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all ${
                  isContentOnly ? 'bg-white/5 border-white/10 text-white/50' : 'bg-accent/10 border-accent/30 text-accent'
                }`}>
                {isContentOnly ? 'Body Only' : 'Full LaTeX'}
              </button>
            )}
          </div>

          {/* Center Main View Area */}
          <div className='flex-1 overflow-hidden relative'>
            {showDiff && optimizationResult ? (
              <div className='h-full flex flex-col'>
                {/* Diff Review Bar */}
                <div className='px-5 py-2.5 bg-[#121215] border-b border-accent/30 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='w-2 h-2 rounded-full bg-accent animate-pulse' />
                    <span className='text-xs font-bold text-white'>
                      Review AI Tailoring Suggestions (Original vs Proposed)
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={handleReject}
                      className='px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all'>
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        handleAccept(
                          activeTab === 'resume'
                            ? optimizationResult.optimizedBody
                            : optimizationResult.coverLetter
                        )
                      }
                      className='px-4 py-1 bg-accent text-black text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md'>
                      Accept Changes
                    </button>
                  </div>
                </div>

                <div className='flex-1 overflow-hidden'>
                  <DiffPreview
                    original={
                      activeTab === 'resume'
                        ? previousDraftResume.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)?.[1]?.trim() || previousDraftResume
                        : previousDraftCoverLetter.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/)?.[1]?.trim() || previousDraftCoverLetter
                    }
                    updated={
                      activeTab === 'resume'
                        ? optimizationResult.optimizedBody
                        : optimizationResult.coverLetter
                    }
                    isVisible={showDiff}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                </div>
              </div>
            ) : viewMode === 'preview' ? (
              <div className='h-full p-4 lg:p-6 overflow-auto flex items-center justify-center'>
                <PdfPreview
                  pdfBase64={currentPreviewPdf}
                  isLoading={isCompilingPreview}
                  error={previewError}
                />
              </div>
            ) : (
              <LatexEditor
                value={(() => {
                  const raw = currentCode;
                  if (!isContentOnly) return raw;
                  const match = raw.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
                  return match ? match[1].trim() : raw;
                })()}
                onChange={(newVal) => {
                  if (activeTab === 'resume') {
                    if (isContentOnly) {
                      const match = draftResume.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
                      const [preamble, post] = [match?.[1] || '', match?.[2] || ''];
                      setDraftResume(`${preamble}\n${newVal}\n${post}`);
                    } else {
                      setDraftResume(newVal);
                    }
                  } else {
                    if (isContentOnly) {
                      const match = draftCoverLetter.match(/([\s\S]*?\\begin\{document\})[\s\S]*?(\\end\{document\}[\s\S]*)/);
                      const [preamble, post] = [match?.[1] || '', match?.[2] || ''];
                      setDraftCoverLetter(`${preamble}\n${newVal}\n${post}`);
                    } else {
                      setDraftCoverLetter(newVal);
                    }
                  }
                }}
              />
            )}
          </div>
        </section>

        {/* Right Resizer */}
        {!isRightCollapsed && (
          <div
            onMouseDown={() => setIsResizingRight(true)}
            className={`w-1.5 h-full cursor-col-resize z-30 shrink-0 relative transition-all ${
              isResizingRight ? 'bg-accent/40' : 'hover:bg-white/10'
            }`}>
            <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px ${isResizingRight ? 'bg-accent' : 'bg-white/10'}`} />
          </div>
        )}

        {/* ── Right Pane: Candidate Profile & AI Inspector Drawer ── */}
        {!isRightCollapsed && (
          <section
            style={{ width: `${rightWidth}px` }}
            className={`shrink-0 border-l border-white/8 flex flex-col overflow-hidden bg-[#0c0c0e] ${
              isResizingRight ? '' : 'transition-[width] duration-300 ease-in-out'
            }`}>
            <div className='flex items-center justify-between px-4 h-10 border-b border-white/8 bg-white/[0.01] shrink-0'>
              <div className='flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5'>
                <button
                  onClick={() => setRightPanelTab('profile')}
                  className={`px-3 py-0.5 rounded-md text-xs font-semibold transition-all ${
                    rightPanelTab === 'profile' ? 'bg-accent text-black shadow-sm' : 'text-white/40 hover:text-white'
                  }`}>
                  Profile
                </button>
                <button
                  onClick={() => setRightPanelTab('ai')}
                  className={`px-3 py-0.5 rounded-md text-xs font-semibold transition-all ${
                    rightPanelTab === 'ai' ? 'bg-accent text-black shadow-sm' : 'text-white/40 hover:text-white'
                  }`}>
                  AI Settings
                </button>
              </div>

              <button
                onClick={() => setIsRightCollapsed(true)}
                className='p-1 hover:bg-white/5 rounded transition-colors text-white/30 hover:text-white'
                title='Close Inspector'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='flex-1 overflow-y-auto p-5 custom-scrollbar'>
              {rightPanelTab === 'profile' ? <CandidateProfilePanel /> : <GeminiConfigPanel />}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export { TransformWorkspace as TailorWorkspace };
