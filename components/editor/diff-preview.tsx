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

  // 1. Detect Hunks (Difference blocks)
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

  // Default to all accepted
  useEffect(() => {
    setAcceptedHunks(new Set(hunks.map(h => h.id)));
  }, [hunks]);

  if (!isVisible) return null;

  const getMergedContent = (currentAccepted: Set<number>) => {
    const originalLines = original.split('\n');
    const finalLines: string[] = [];
    let hIdx = 0;
    for (let i = 0; i < originalLines.length; i++) {
      const h = hunks[hIdx];
      if (h && h.startIndex === i) {
        if (currentAccepted.has(h.id)) finalLines.push(...h.updated);
        else finalLines.push(...h.original);
        i += h.original.length - 1;
        hIdx++;
      } else {
        finalLines.push(originalLines[i]);
      }
    }
    return finalLines.join('\n');
  };

  const toggleHunk = (id: number) => {
    const next = new Set(acceptedHunks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAcceptedHunks(next);
    
    if (onPreviewUpdate) {
      onPreviewUpdate(getMergedContent(next));
    }
  };

  const handleFinalApply = () => {
    onAccept(getMergedContent(acceptedHunks));
  };

  const originalLines = original.split('\n');

  return (
    <div className='flex flex-col h-full bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl'>
      {/* GitHub Style Header */}
      <div className='px-4 h-12 bg-[#161b22] border-b border-white/10 flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5'>
            <div className='w-3 h-3 rounded-full bg-[#ff5f56]' />
            <div className='w-3 h-3 rounded-full bg-[#ffbd2e]' />
            <div className='w-3 h-3 rounded-full bg-[#27c93f]' />
          </div>
          <div className='h-4 w-px bg-white/10 mx-1' />
          <span className='text-[10px] font-bold text-white/50 uppercase tracking-widest'>Intelligence Review Mode</span>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={onReject}
            className='px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all'
          >
            Discard All
          </button>
          <button
            onClick={handleFinalApply}
            className='px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95'
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className='flex-1 overflow-auto bg-[#0d1117] font-mono text-[13px] leading-[1.6] custom-scrollbar selection:bg-accent/30'>
        {(() => {
          const elements = [];
          let hunkIdx = 0;
          
          for (let i = 0; i < originalLines.length; i++) {
            const hunk = hunks[hunkIdx];
            
            if (hunk && hunk.startIndex === i) {
              const isAccepted = acceptedHunks.has(hunk.id);
              
              elements.push(
                <div key={`hunk-${hunk.id}`} className='relative group border-y border-white/[0.05] bg-white/[0.01]'>
                  {/* Hunk Checkbox/Toggle Overlay */}
                  <div className='absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <button 
                      onClick={() => toggleHunk(hunk.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tighter transition-all ${
                        isAccepted 
                          ? 'bg-accent/20 border-accent/40 text-accent' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                      }`}
                    >
                      {isAccepted ? '✓ Accepted' : 'Discarded'}
                    </button>
                  </div>

                  {/* Deletions (Red) */}
                  <div className={`transition-opacity duration-300 ${isAccepted ? 'opacity-40' : 'opacity-100 bg-red-900/10'}`}>
                    {hunk.original.map((line, li) => (
                      <div key={`orig-${li}`} className='flex hover:bg-red-500/10 transition-colors'>
                        <div className='w-12 shrink-0 flex justify-center text-red-500/30 select-none border-r border-white/5 text-[10px]'>-</div>
                        <div className='flex-1 px-4 text-red-400 whitespace-pre-wrap break-words italic line-through decoration-red-500/50'>{line || ' '}</div>
                      </div>
                    ))}
                  </div>

                  {/* Additions (Green) */}
                  <div className={`transition-all duration-300 ${!isAccepted ? 'opacity-40' : 'opacity-100 bg-green-900/10'}`}>
                    {hunk.updated.map((line, li) => (
                      <div key={`upd-${li}`} className='flex hover:bg-green-500/10 transition-colors'>
                        <div className='w-12 shrink-0 flex justify-center text-green-500/40 select-none border-r border-white/5 text-[10px]'>+</div>
                        <div className='flex-1 px-4 text-green-400 whitespace-pre-wrap break-words font-medium'>{line || ' '}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
              i += hunk.original.length - 1;
              hunkIdx++;
            } else {
              elements.push(
                <div key={`line-${i}`} className='flex hover:bg-white/[0.02] transition-colors group opacity-40 hover:opacity-100'>
                  <div className='w-12 shrink-0 flex justify-center text-white/10 select-none border-r border-white/5 text-[10px]'>{i + 1}</div>
                  <div className='flex-1 px-4 text-white/40 whitespace-pre-wrap break-words'>{originalLines[i] || ' '}</div>
                </div>
              );
            }
          }
          return elements;
        })()}
      </div>

      {/* Footer Info */}
      <div className='px-4 h-8 bg-[#161b22] border-t border-white/10 flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-4 text-[9px] font-medium text-white/20 uppercase tracking-[0.2em]'>
          <span>{hunks.length} changes detected</span>
          <span className='h-2 w-px bg-white/10' />
          <span>{acceptedHunks.size} accepted</span>
        </div>
      </div>
    </div>
  );
}
