'use client';
import React, {useState} from 'react';
import {useGeminiConfig} from '@/hooks/use-gemini-config';
import {GEMINI_MODELS} from '@/constants/models';

export function GeminiConfigPanel() {
  const {keys, activeKeyId, selectedModel, autoSwitch, isLoaded, lastResetAt, addKey, removeKey, setActiveKey, setModel, setAutoSwitch} = useGeminiConfig();

  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  if (!isLoaded) return null;

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    addKey(newKey.trim(), newLabel.trim());
    setNewKey('');
    setNewLabel('');
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center gap-4 px-2'>
        <div className='p-2 bg-accent/10 text-accent rounded-xl'>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2.5'
              d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'
            />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
        </div>
        <div>
          <h3 className='text-[10px] font-black text-white uppercase tracking-[0.2em]'>AI Configuration</h3>
          <p className='text-[9px] text-white/20 font-black uppercase tracking-widest mt-1'>
            Reset: {lastResetAt ? new Date(lastResetAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'Never'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className='space-y-8'>
        {/* Model Selection */}
        <div className='space-y-4'>
          <label className='block text-[9px] font-black text-white/30 uppercase tracking-[0.3em]'>Inference Engine</label>
          <div className='grid grid-cols-1 gap-2'>
            {GEMINI_MODELS.map((m) => {
              const activeKey = keys.find((k) => k.id === activeKeyId);
              const usage = activeKey?.usageByModel[m.id] || 0;
              const isAtLimit = usage >= m.limit;

              return (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`relative px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all flex items-center justify-between ${
                    selectedModel === m.id ?
                      'bg-accent/10 border-accent/40 text-accent shadow-[0_0_20px_rgba(136,255,0,0.1)]'
                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}>
                  <span className='flex items-center gap-2'>
                    {m.name}
                    {isAtLimit && (
                      <svg className='w-3 h-3 text-red-500 animate-pulse' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                  </span>
                  <span className={`text-[8px] tabular-nums ${isAtLimit ? 'text-red-500' : 'opacity-40'}`}>{usage}/20</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Switching */}
        <div className='flex items-center justify-between p-5 rounded-lg bg-white/[0.02] border border-white/5'>
          <div>
            <p className='text-[10px] font-black text-white uppercase tracking-widest'>Dynamic Redundancy</p>
            <p className='text-[9px] text-white/20 font-black uppercase tracking-widest mt-1'>Auto-switch on limit</p>
          </div>
          <button
            onClick={() => setAutoSwitch(!autoSwitch)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-300 ${autoSwitch ? 'bg-accent' : 'bg-white/10'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xl transition duration-300 ${autoSwitch ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Keys List */}
        <div className='space-y-4'>
          <label className='block text-[9px] font-black text-white/30 uppercase tracking-[0.3em]'>Access Credentials ({keys.length})</label>
          <div className='space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar'>
            {keys.map((k) => (
              <div
                key={k.id}
                className={`group flex items-center justify-between p-4 rounded-lg border transition-all ${
                  activeKeyId === k.id ? 'bg-white/5 border-accent/30 shadow-2xl' : 'bg-white/[0.02] border-white/5'
                }`}>
                <button onClick={() => setActiveKey(k.id)} className='flex-1 text-left'>
                  <div className='flex items-center gap-3'>
                    <p className='text-[10px] font-black text-white uppercase tracking-widest'>{k.label}</p>
                    {activeKeyId === k.id ?
                      <div className='w-1.5 h-1.5 rounded-full bg-accent animate-pulse' />
                    : Object.values(k.usageByModel).some((v) => v >= 20) && (
                        <svg className='w-3 h-3 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                      )
                    }
                  </div>
                  <p className='text-[9px] text-white/20 tabular-nums font-mono mt-1 uppercase tracking-widest'>
                    {k.key.slice(0, 4)}••••{k.key.slice(-4)} • Usage: {Object.values(k.usageByModel).reduce((a, b) => a + b, 0)} calls
                  </p>
                </button>
                <button onClick={() => removeKey(k.id)} className='opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-500 transition-all'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2.5'
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    />
                  </svg>
                </button>
              </div>
            ))}
            {keys.length === 0 && (
              <div className='text-center py-10 border border-dashed border-white/10 rounded-lg bg-white/[0.01]'>
                <p className='text-[10px] font-black text-white/10 uppercase tracking-widest'>No credentials detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Key Form */}
        <form onSubmit={handleAddKey} className='pt-2 space-y-3'>
          <div className='flex flex-col gap-2'>
            <input
              type='text'
              placeholder='Label…'
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className='w-full px-4 py-3 text-[10px] bg-white/5 border border-white/5 rounded-xl focus:border-accent/40 text-white transition-all placeholder:text-white/10 outline-none uppercase tracking-widest'
            />
            <input
              type='password'
              placeholder='Private Key…'
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className='w-full px-4 py-3 text-[10px] bg-white/5 border border-white/5 rounded-xl focus:border-accent/40 text-white transition-all placeholder:text-white/10 outline-none'
            />
            <button
              type='submit'
              disabled={!newKey.trim()}
              className='w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-accent transition-all duration-300 disabled:opacity-30 active:scale-95'>
              Authorize Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
