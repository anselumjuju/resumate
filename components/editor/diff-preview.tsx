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
    <div className='flex flex-col h-full bg-[#1e1e1e] rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200'>
      {/* VS Code Style Header */}
      <div className='px-4 py-2 bg-[#252526] border-b border-neutral-800 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1'>
            <div className='w-3 h-3 rounded-full bg-[#ff5f56]' />
            <div className='w-3 h-3 rounded-full bg-[#ffbd2e]' />
            <div className='w-3 h-3 rounded-full bg-[#27c93f]' />
          </div>
          <span className='text-[11px] font-medium text-neutral-400 uppercase tracking-widest'>Unified Diff</span>
        </div>

        <div className='flex items-center gap-3'>
          <button
            onClick={onReject}
            className='text-xs text-neutral-400 hover:text-neutral-200 transition-colors'
          >
            Discard All
          </button>
          <button
            onClick={handleFinalApply}
            className='px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-lg transition-all active:scale-95'
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className='flex-1 overflow-auto bg-[#1e1e1e] font-mono text-[13px] leading-[1.6] custom-scrollbar p-2'>
        {(() => {
          const elements = [];
          let hunkIdx = 0;
          
          for (let i = 0; i < originalLines.length; i++) {
            const hunk = hunks[hunkIdx];
            
            if (hunk && hunk.startIndex === i) {
              const isAccepted = acceptedHunks.has(hunk.id);
              elements.push(
                <div key={`hunk-${hunk.id}`} className='relative group my-1'>
                  {/* Floating Action Bar */}
                  <div className='absolute right-4 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex bg-[#333333] border border-neutral-700 rounded shadow-2xl p-0.5 gap-0.5'>
                    <button 
                      onClick={() => toggleHunk(hunk.id)}
                      title="Accept Change"
                      className={`p-1.5 rounded transition-all ${isAccepted ? 'bg-green-600/20 text-green-400' : 'text-neutral-400 hover:bg-white/10 hover:text-green-400'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => toggleHunk(hunk.id)}
                      title="Discard Change"
                      className={`p-1.5 rounded transition-all ${!isAccepted ? 'bg-red-600/20 text-red-400' : 'text-neutral-400 hover:bg-white/10 hover:text-red-400'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Red (Removed) */}
                  <div className={`transition-opacity duration-200 ${isAccepted ? 'opacity-30' : 'opacity-100'}`}>
                    {hunk.original.map((line, li) => (
                      <div key={`orig-${li}`} className='flex bg-[#4b1818] border-l-4 border-red-500'>
                        <div className='w-10 shrink-0 flex justify-center text-[#ff8080] select-none text-[11px] opacity-40'>-</div>
                        <div className='flex-1 px-2 text-[#ff8080] whitespace-pre-wrap break-words'>{line || ' '}</div>
                      </div>
                    ))}
                  </div>

                  {/* Green (Added) */}
                  <div className={`transition-opacity duration-200 ${!isAccepted ? 'opacity-30' : 'opacity-100'}`}>
                    {hunk.updated.map((line, li) => (
                      <div key={`upd-${li}`} className='flex bg-[#1e3a1e] border-l-4 border-green-500'>
                        <div className='w-10 shrink-0 flex justify-center text-[#99ff99] select-none text-[11px] opacity-40'>+</div>
                        <div className='flex-1 px-2 text-[#99ff99] whitespace-pre-wrap break-words'>{line || ' '}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
              i += hunk.original.length - 1;
              hunkIdx++;
            } else {
              elements.push(
                <div key={`line-${i}`} className='flex hover:bg-white/5 transition-colors group'>
                  <div className='w-10 shrink-0 flex justify-center text-neutral-600 select-none text-[11px]'>{i + 1}</div>
                  <div className='flex-1 px-2 text-neutral-400 whitespace-pre-wrap break-words'>{originalLines[i] || ' '}</div>
                </div>
              );
            }
          }
          return elements;
        })()}
      </div>
      
      {/* Footer hint */}
      <div className='px-4 py-2 bg-[#1e1e1e] border-t border-neutral-800'>
        <p className='text-[10px] text-neutral-500 italic'>Hover over changes to see Accept (✓) and Discard (✕) options.</p>
      </div>
    </div>
  );
}
