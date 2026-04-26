'use client';

import { useState, useEffect, useMemo } from 'react';

interface DiffPreviewProps {
  original: string;
  updated: string;
  onAccept: (finalBody: string) => void;
  onReject: () => void;
  onPreviewUpdate?: (mergedBody: string) => void;
  isVisible: boolean;
}

interface Hunk {
  id: number;
  original: string[];
  updated: string[];
  startIndex: number;
}

export function DiffPreview({original, updated, onAccept, onReject, onPreviewUpdate, isVisible}: DiffPreviewProps) {
  const [acceptedHunks, setAcceptedHunks] = useState<Set<number>>(new Set());

  // 1. Detect Hunks
  const hunks = useMemo(() => {
    const originalLines = original.split('\n');
    const updatedLines = updated.split('\n');
    const detectedHunks: Hunk[] = [];
    
    let currentHunk: Hunk | null = null;
    const maxLines = Math.max(originalLines.length, updatedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const isDifferent = originalLines[i] !== updatedLines[i];

      if (isDifferent) {
        if (!currentHunk) {
          currentHunk = {
            id: detectedHunks.length,
            original: [],
            updated: [],
            startIndex: i
          };
        }
        if (i < originalLines.length) currentHunk.original.push(originalLines[i]);
        if (i < updatedLines.length) currentHunk.updated.push(updatedLines[i]);
      } else {
        if (currentHunk) {
          detectedHunks.push(currentHunk);
          currentHunk = null;
        }
      }
    }
    if (currentHunk) detectedHunks.push(currentHunk);
    return detectedHunks;
  }, [original, updated]);

  useEffect(() => {
    setAcceptedHunks(new Set(hunks.map(h => h.id)));
  }, [hunks]);

  if (!isVisible) return null;

  const toggleHunk = (id: number) => {
    const next = new Set(acceptedHunks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAcceptedHunks(next);
    
    // Compute current merged body for preview
    if (onPreviewUpdate) {
      const originalLines = original.split('\n');
      const finalLines: string[] = [];
      let hIdx = 0;
      for (let i = 0; i < originalLines.length; i++) {
        const h = hunks[hIdx];
        if (h && h.startIndex === i) {
          if (next.has(h.id)) finalLines.push(...h.updated);
          else finalLines.push(...h.original);
          i += h.original.length - 1;
          hIdx++;
        } else {
          finalLines.push(originalLines[i]);
        }
      }
      onPreviewUpdate(finalLines.join('\n'));
    }
  };

  const handleFinalApply = () => {
    const originalLines = original.split('\n');
    const finalLines: string[] = [];
    let hunkIdx = 0;
    for (let i = 0; i < originalLines.length; i++) {
      const hunk = hunks[hunkIdx];
      if (hunk && hunk.startIndex === i) {
        if (acceptedHunks.has(hunk.id)) finalLines.push(...hunk.updated);
        else finalLines.push(...hunk.original);
        i += hunk.original.length - 1;
        hunkIdx++;
      } else {
        finalLines.push(originalLines[i]);
      }
    }
    onAccept(finalLines.join('\n'));
  };

  const originalLines = original.split('\n');

  return (
    <div className='flex flex-col h-full bg-black rounded-xl border border-white/20 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500'>
      {/* Code Header */}
      <div className='px-6 h-12 bg-white/[0.03] border-b border-white/20 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-white/10' />
            <div className='w-2 h-2 rounded-full bg-white/10' />
            <div className='w-2 h-2 rounded-full bg-white/10' />
          </div>
          <span className='text-[9px] font-black text-white/20 uppercase tracking-[0.4em]'>Unified Conflict Resolution</span>
        </div>

        <div className='flex items-center gap-4'>
          <button
            onClick={onReject}
            className='text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors'
          >
            Purge All
          </button>
          <button
            onClick={handleFinalApply}
            className='px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
          >
            Commit Merge
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className='flex-1 overflow-auto bg-black font-mono text-[12px] leading-[1.8] custom-scrollbar p-4'>
        {(() => {
          const elements = [];
          let hunkIdx = 0;
          
          for (let i = 0; i < originalLines.length; i++) {
            const hunk = hunks[hunkIdx];
            
            if (hunk && hunk.startIndex === i) {
              const isAccepted = acceptedHunks.has(hunk.id);
              elements.push(
                <div key={`hunk-${hunk.id}`} className='relative group my-4 rounded-xl overflow-hidden border border-white/[0.02]'>
                  {/* Floating Action Bar */}
                  <div className='absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-all flex bg-black border border-white/10 rounded-xl shadow-2xl p-1 gap-1'>
                    <button 
                      onClick={() => toggleHunk(hunk.id)}
                      title="Accept Change"
                      className={`p-2 rounded-lg transition-all ${isAccepted ? 'bg-accent/20 text-accent' : 'text-white/20 hover:bg-white/5 hover:text-accent'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => toggleHunk(hunk.id)}
                      title="Discard Change"
                      className={`p-2 rounded-lg transition-all ${!isAccepted ? 'bg-white/10 text-white/60' : 'text-white/20 hover:bg-white/5 hover:text-white/60'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Red (Removed) */}
                  <div className={`transition-all duration-500 ${isAccepted ? 'opacity-20 scale-[0.99] grayscale' : 'opacity-100'}`}>
                    {hunk.original.map((line, li) => (
                      <div key={`orig-${li}`} className='flex bg-red-500/[0.03] border-l-2 border-red-500/20'>
                        <div className='w-12 shrink-0 flex justify-center text-red-500/30 select-none text-[10px]'>-</div>
                        <div className='flex-1 px-4 text-red-500/60 whitespace-pre-wrap break-words italic'>{line || ' '}</div>
                      </div>
                    ))}
                  </div>

                  {/* Green (Added) */}
                  <div className={`transition-all duration-500 ${!isAccepted ? 'opacity-20 scale-[0.99] grayscale' : 'opacity-100'}`}>
                    {hunk.updated.map((line, li) => (
                      <div key={`upd-${li}`} className='flex bg-accent/[0.03] border-l-2 border-accent/40'>
                        <div className='w-12 shrink-0 flex justify-center text-accent/40 select-none text-[10px]'>+</div>
                        <div className='flex-1 px-4 text-accent whitespace-pre-wrap break-words font-bold'>{line || ' '}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
              i += hunk.original.length - 1;
              hunkIdx++;
            } else {
              elements.push(
                <div key={`line-${i}`} className='flex hover:bg-white/[0.02] transition-colors group py-0.5'>
                  <div className='w-12 shrink-0 flex justify-center text-white/10 select-none text-[9px] tabular-nums'>{i + 1}</div>
                  <div className='flex-1 px-4 text-white/30 whitespace-pre-wrap break-words font-medium'>{originalLines[i] || ' '}</div>
                </div>
              );
            }
          }
          return elements;
        })()}
      </div>
      
      {/* Footer hint */}
      <div className='px-6 h-10 bg-black border-t border-white/20 flex items-center'>
        <p className='text-[8px] font-black text-white/10 uppercase tracking-[0.2em]'>Interactive Merge Protocol Active</p>
      </div>
    </div>
  );
}
