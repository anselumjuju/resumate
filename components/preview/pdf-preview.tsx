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
    <div className='w-full h-full flex flex-col bg-black rounded-xl border border-white/5 overflow-hidden relative'>
      {/* View Mode Controls */}
      {pdfBase64 && !error && !isLoading && !hideControls && (
        <div className='absolute top-4 right-4 z-20 flex bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 gap-1 shadow-2xl'>
          <button
            onClick={() => setFitMode('FitH')}
            title='Fit Width'
            className={`px-3 py-1.5 rounded-lg transition-all ${fitMode === 'FitH' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M4 12h16M4 12l4-4m-4 4l4 4m12-4l-4-4m4 4l-4 4' />
            </svg>
          </button>
          <button
            onClick={() => setFitMode('FitV')}
            title='Fit Height'
            className={`px-3 py-1.5 rounded-lg transition-all ${fitMode === 'FitV' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}>
            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M12 4v16M12 4l-4 4m4-4l4 4m-4 12l-4-4m4 4l4 -4' />
            </svg>
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-black transition-all'>
           <div className='relative flex items-center justify-center'>
              <svg className='animate-spin h-8 w-8 text-accent' fill='none' viewBox='0 0 24 24'>
                <circle className='opacity-10' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3'></circle>
                <path className='opacity-90' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
              </svg>
           </div>
          <p className='text-[10px] font-black text-white/40 tracking-[0.4em] uppercase mt-6'>Compiling Projection</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className='flex flex-col items-center w-full h-full p-12 overflow-auto bg-red-900/5'>
          <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6'>
            <svg className='h-8 w-8 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <h3 className='text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4'>Projection Terminated</h3>
          <pre className='text-[11px] bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] text-white/60 overflow-auto whitespace-pre-wrap w-full leading-relaxed custom-scrollbar'>
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
        <div className='flex-1 flex flex-col items-center justify-center text-white/10'>
          <div className='p-6 bg-white/[0.02] rounded-[2.5rem] mb-6 border border-white/5'>
            <svg className='h-12 w-12 opacity-30' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <p className='text-[10px] font-black uppercase tracking-[0.4em]'>Awaiting Projection</p>
        </div>
      )}
    </div>
  );
}
