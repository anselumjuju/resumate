"use client";

import React, { useState, useEffect } from "react";
import { LatexEditor } from "@/components/editor/latex-editor";
import { PdfPreview } from "@/components/preview/pdf-preview";
import { compilePdf } from "@/actions/compile-pdf";

const defaultLatex = `\\documentclass[a4paper,10pt]{article}
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

export function Workspace() {
  const [code, setCode] = useState(defaultLatex);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 1.5 second debounce timer
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      
      const result = await compilePdf(code);
      
      if (result.success && result.pdfBase64) {
        setPdfBase64(result.pdfBase64);
        setError(null);
      } else {
        setPdfBase64(null);
        // Clean up error log display
        setError(`${result.error}\n\nLogs:\n${result.logs || "No logs available"}`);
      }
      
      setIsLoading(false);
    }, 1500);

    // Cleanup timer on every keystroke
    return () => clearTimeout(timer);
  }, [code]); // Only runs when 'code' changes

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Editor Panel */}
      <section className="flex-1 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          Editor
        </div>
        <div className="flex-1 overflow-hidden">
          <LatexEditor value={code} onChange={setCode} />
        </div>
      </section>

      {/* Preview Panel */}
      <section className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          Preview
        </div>
        <div className="flex-1 p-4 overflow-auto bg-neutral-100 dark:bg-neutral-900">
          <PdfPreview isLoading={isLoading} error={error} pdfBase64={pdfBase64} />
        </div>
      </section>
    </main>
  );
}
