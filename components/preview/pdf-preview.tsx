import React from 'react';

interface PdfPreviewProps {
  isLoading?: boolean;
  error?: string | null;
  pdfBase64?: string | null;
  hideControls?: boolean;
}

export function PdfPreview({isLoading = false, error = null, pdfBase64 = null, hideControls = false}: PdfPreviewProps) {
  const [fitMode, setFitMode] = React.useState<'FitH' | 'FitV'>('FitH');

  return (
    <div className='w-full h-full flex flex-col bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-2xl border border-dashed border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden relative'>
      {/* Fit Mode Toggle */}
      {pdfBase64 && !error && !isLoading && !hideControls && (
        <div className='absolute top-4 right-4 z-20 flex bg-white/90 dark:bg-neutral-900/90 backdrop-blur shadow-sm border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-1 gap-1'>
          <button
            onClick={() => setFitMode('FitH')}
            title='Fit to Width'
            className={`p-2 rounded-lg transition-all ${fitMode === 'FitH' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M4 12h16M4 12l4-4m-4 4l4 4m12-4l-4-4m4 4l-4 4' />
            </svg>
          </button>
          <button
            onClick={() => setFitMode('FitV')}
            title='Fit to Height'
            className={`p-2 rounded-lg transition-all ${fitMode === 'FitV' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M12 4v16M12 4l-4 4m4-4l4 4m-4 12l-4-4m4 4l4 -4' />
            </svg>
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md transition-all'>
          <svg className='animate-spin h-8 w-8 mb-4 text-indigo-500' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-20' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3'></circle>
            <path
              className='opacity-80'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
          </svg>
          <p className='text-xs font-semibold text-neutral-900 dark:text-neutral-100 tracking-wider uppercase'>Compiling PDF</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className='flex flex-col items-center text-red-600 dark:text-red-400 w-full h-full px-8 py-8 overflow-auto bg-red-50/50 dark:bg-red-950/10'>
          <div className='p-3 bg-red-100 dark:bg-red-900/30 rounded-xl mb-4'>
            <svg className='h-8 w-8 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <p className='text-sm font-semibold tracking-tight mb-2 text-neutral-900 dark:text-neutral-100'>Compilation Failed</p>
          <pre className='text-xs mt-2 bg-white dark:bg-black p-4 rounded-xl text-left overflow-auto whitespace-pre-wrap w-full border border-red-200/50 dark:border-red-900/50 shadow-sm leading-relaxed'>
            {error}
          </pre>
        </div>
      )}

      {/* PDF Viewer */}
      {pdfBase64 && !error && (
        <embed
          key={fitMode + (pdfBase64 ? pdfBase64.slice(-20) : '')}
          src={`data:application/pdf;base64,${pdfBase64}#toolbar=0&view=${fitMode}`}
          type='application/pdf'
          className='w-full h-full border-none'
        />
      )}

      {/* Placeholder State */}
      {!pdfBase64 && !error && !isLoading && (
        <div className='flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-600'>
          <div className='p-4 bg-white dark:bg-neutral-900/50 rounded-2xl mb-4 border border-neutral-100 dark:border-neutral-800/50 shadow-sm'>
            <svg className='h-8 w-8 opacity-75' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <p className='text-xs font-medium tracking-wide'>PDF preview will appear here</p>
        </div>
      )}
    </div>
  );
}
