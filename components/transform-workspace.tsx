'use client';

import React, {useState, useEffect} from 'react';
import {PdfPreview} from '@/components/preview/pdf-preview';
import {compilePdf} from '@/actions/compile-pdf';

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
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [baseResume, setBaseResume] = useState('');
  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume');
  const [isHydrated, setIsHydrated] = useState(false);

  const [resumePdfBase64, setResumePdfBase64] = useState<string | null>(null);
  const [isCompilingPreview, setIsCompilingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Hydrate from sessionStorage and localStorage
  useEffect(() => {
    const savedCompany = sessionStorage.getItem('target_company');
    const savedJD = sessionStorage.getItem('target_jd');
    const savedResume = localStorage.getItem('base_resume') || '';

    if (savedCompany) setCompanyName(savedCompany);
    if (savedJD) setJobDescription(savedJD);
    setBaseResume(savedResume);

    setIsHydrated(true);
  }, []);

  // Save to sessionStorage when values change
  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem('target_company', companyName);
    sessionStorage.setItem('target_jd', jobDescription);
  }, [companyName, jobDescription, isHydrated]);

  // Compile base resume for preview
  useEffect(() => {
    if (!isHydrated || !baseResume) return;

    let isMounted = true;
    const loadPreview = async () => {
      setIsCompilingPreview(true);
      const result = await compilePdf(baseResume);
      if (isMounted && result.success && result.pdfBase64) {
        setResumePdfBase64(result.pdfBase64);
      }
      if (isMounted) setIsCompilingPreview(false);
    };

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [isHydrated, baseResume]);

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
          const result = await compilePdf(baseResume);
          if (result.success && result.pdfBase64) pdfData = result.pdfBase64;
          else throw new Error(result.error || 'Failed to compile resume PDF');
        }

        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = `${filePrefix}_resume.pdf`;
        link.click();
      } else {
        // Cover Letter Generation
        const coverLetterText = 'This is a placeholder cover letter.\\n\\nIt will be replaced by AI generated text soon.';
        const clLatex = `\\documentclass[11pt]{letter}\n\\usepackage[margin=1in]{geometry}\n\\begin{document}\n\\begin{letter}{}\n\\opening{Dear Hiring Manager,}\n\n${coverLetterText}\n\n\\closing{Sincerely,\\\\Your Name}\n\\end{letter}\n\\end{document}`;

        const result = await compilePdf(clLatex);
        if (result.success && result.pdfBase64) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${result.pdfBase64}`;
          link.download = `${filePrefix}_cover_letter.pdf`;
          link.click();
        } else {
          throw new Error(result.error || 'Failed to compile cover letter PDF');
        }
      }
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
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
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Target Opportunity</span>
          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">AI Workflow</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveJob}
            disabled={!companyName.trim() && !jobDescription.trim()}
            className='px-3 py-1.5 text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'>
            Save to History
          </button>
          <button
            disabled={true}
            title='AI optimization coming soon'
            className='flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Optimize with AI
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <main className='flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-50 dark:bg-[#050505]'>

        {/* ── Left Panel: Job Context ── */}
        <section className='w-full lg:w-[42%] lg:max-w-[520px] shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200/60 dark:border-neutral-800/60 flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0a]'>

          {/* Panel header */}
          <div className='px-6 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/80 dark:bg-neutral-900/20 shrink-0'>
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5">Step 1</p>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Define the Opportunity</h2>
          </div>

          {/* Scrollable form area */}
          <div className='flex-1 overflow-y-auto'>

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
                className='w-full px-0 py-1.5 bg-transparent border-b-2 border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors duration-150 placeholder:text-neutral-300 dark:placeholder:text-neutral-700'
              />
            </div>

            {/* Job Description */}
            <div className='px-6 pt-5 pb-5 flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <label htmlFor='jobDescription' className='block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest'>
                  Job Description
                </label>
                {jobDescription.length > 0 && (
                  <span className='text-[10px] text-neutral-400 tabular-nums'>
                    {jobDescription.split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>
              <textarea
                id='jobDescription'
                placeholder='Paste the full job description here. The more detail, the better the keyword analysis and AI output.'
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className='w-full min-h-[280px] px-4 py-3.5 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/60 dark:focus:border-indigo-500/50 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 resize-none transition-all duration-200 placeholder:text-neutral-400/60 dark:placeholder:text-neutral-600'
              />
            </div>

            {/* Keyword Analysis */}
            {missingKeywords.length > 0 && (
              <div className='mx-6 mb-6 p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30'>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  <p className='text-xs font-semibold text-violet-900 dark:text-violet-200'>
                    {missingKeywords.length} keywords missing from your resume
                  </p>
                </div>
                <p className='text-[11px] text-violet-700/70 dark:text-violet-400/70 mb-3 leading-relaxed'>
                  These terms appear in the job description but not in your base resume:
                </p>
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

        {/* ── Right Panel: Preview ── */}
        <section className='flex-1 flex flex-col overflow-hidden bg-neutral-50/50 dark:bg-[#080808]'>

          {/* Panel header */}
          <div className='px-6 py-3 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm shrink-0 flex items-center justify-between gap-4'>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-0.5">Step 2</p>
              <div className='flex bg-neutral-100 dark:bg-neutral-800/80 rounded-lg p-0.5 gap-0.5'>
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === 'resume' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                  Resume
                </button>
                <button
                  onClick={() => setActiveTab('cover_letter')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${activeTab === 'cover_letter' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                  Cover Letter
                </button>
              </div>
            </div>

            {/* Download — always visible */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || isCompilingPreview}
              className='shrink-0 flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'></path>
              </svg>
              <span>{isDownloading ? 'Generating…' : 'Download PDF'}</span>
            </button>
          </div>

          {/* Preview area */}
          <div className='flex-1 p-5 overflow-auto'>
            {activeTab === 'resume' ? (
              <PdfPreview isLoading={isCompilingPreview} pdfBase64={resumePdfBase64} />
            ) : (
              <div className='w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] rounded-2xl border border-dashed border-neutral-200/60 dark:border-neutral-700/60'>
                <div className='p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl mb-4 border border-neutral-100 dark:border-neutral-800/50'>
                  <svg className='h-8 w-8 text-neutral-400 dark:text-neutral-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                </div>
                <p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1'>Cover letter preview</p>
                <p className='text-xs text-neutral-400 dark:text-neutral-600'>Will be generated by AI once connected</p>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}
