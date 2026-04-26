"use client";

import React, { useState, useEffect } from "react";
import { LatexEditor } from "@/components/editor/latex-editor";
import { PdfPreview } from "@/components/preview/pdf-preview";
import { compilePdf } from "@/actions/compile-pdf";

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
  const [resumeCode, setResumeCode] = useState("");
  const [clCode, setClCode] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  useEffect(() => {
    const savedResume = localStorage.getItem("base_resume");
    const savedCL = localStorage.getItem("base_cover_letter");
    setResumeCode(savedResume || defaultResume);
    setClCode(savedCL || defaultCoverLetter);
    setIsHydrated(true);
  }, []);

  const currentCode = activeTab === 'resume' ? resumeCode : clCode;
  const setCode = activeTab === 'resume' ? setResumeCode : setClCode;

  const saveAndCompile = async (codeToSave: string, tab: 'resume' | 'cover_letter') => {
    setSaveStatus("saving");
    localStorage.setItem(tab === 'resume' ? "base_resume" : "base_cover_letter", codeToSave);
    setIsLoading(true);
    setError(null);

    const result = await compilePdf(codeToSave);

    if (result.success && result.pdfBase64) {
      setPdfBase64(result.pdfBase64);
      setError(null);
    } else {
      setPdfBase64(null);
      setError(`${result.error}\n\nLogs:\n${result.logs || "No logs available"}`);
    }

    setIsLoading(false);
    setSaveStatus("saved");
  };

  // Debounced auto-save
  useEffect(() => {
    if (!isHydrated) return;
    setSaveStatus("unsaved");
    const timer = setTimeout(() => saveAndCompile(currentCode, activeTab), 1500);
    return () => clearTimeout(timer);
  }, [currentCode, activeTab, isHydrated]);

  const handleManualSave = () => saveAndCompile(currentCode, activeTab);

  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-sm text-neutral-400">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading workspace…
      </div>
    );
  }

  const saveLabel =
    saveStatus === "saving" ? "Saving…" :
    saveStatus === "unsaved" ? "Unsaved changes" :
    "Saved";

  return (
    <div className="flex flex-col h-full w-full">

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-[#f8f8f8]/90 dark:bg-[#0d0d0d]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Base Template</span>
          </div>
          
          <div className="flex bg-neutral-200/60 dark:bg-neutral-800/60 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'resume' 
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => setActiveTab('cover_letter')}
              className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeTab === 'cover_letter' 
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Cover Letter
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <span className={[
              "inline-block w-1.5 h-1.5 rounded-full transition-colors duration-300",
              saveStatus === "saved"   ? "bg-emerald-500" :
              saveStatus === "saving"  ? "bg-amber-400 animate-pulse" :
                                         "bg-neutral-400",
            ].join(" ")} />
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">{saveLabel}</span>
          </div>

          <button
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg hover:from-indigo-600 hover:to-violet-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500/50 shadow-sm transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save & Compile
          </button>
        </div>
      </div>

      {/* ── Split layout ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neutral-100/50 dark:bg-[#0a0a0a]">

        {/* Left: Editor */}
        <section className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-[#f8f8f8] dark:bg-[#111] shrink-0">
            <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">LaTeX Source</span>
          </div>
          <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
            <LatexEditor value={currentCode} onChange={setCode} />
          </div>
        </section>

        {/* Right: PDF Preview */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-[#f8f8f8] dark:bg-[#111] shrink-0">
            <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">PDF Preview</span>
            {isLoading && (
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-neutral-400">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Compiling…
              </span>
            )}
          </div>
          <div className="flex-1 p-4 overflow-auto bg-neutral-200/40 dark:bg-neutral-950/60">
            <PdfPreview isLoading={isLoading} error={error} pdfBase64={pdfBase64} />
          </div>
        </section>

      </main>
    </div>
  );
}
