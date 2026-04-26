'use client';

import React, {useState} from 'react';
import {useGeminiConfig} from '@/hooks/use-gemini-config';
import {GeminiModel} from '@/types/ai';

export function GeminiConfigPanel() {
  const {keys, activeKeyId, selectedModel, autoSwitch, isLoaded, addKey, removeKey, setActiveKey, setModel, setAutoSwitch} = useGeminiConfig();

  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isLoaded) return null;

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    addKey(newKey.trim(), newLabel.trim());
    setNewKey('');
    setNewLabel('');
  };

  return (
    <div className='border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl bg-white dark:bg-[#0a0a0a] overflow-hidden transition-all duration-300'>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'
              />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
          </div>
          <div className='text-left'>
            <h3 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100'>AI Configuration</h3>
            <p className='text-[11px] text-neutral-500 dark:text-neutral-500'>Manage Gemini API keys and models</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className='px-6 pb-6 pt-2 space-y-6 border-t border-neutral-100 dark:border-neutral-800/40'>
          {/* Model Selection */}
          <div className='space-y-3'>
            <label className='block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest'>Selected Model</label>
            <div className='grid grid-cols-3 gap-2'>
              {(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'] as GeminiModel[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  className={`px-2 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                    selectedModel === m ?
                      'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                    : 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}>
                  {m.replace('gemini-', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switching */}
          <div className='flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/60'>
            <div>
              <p className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>Auto-switch Key</p>
              <p className='text-[10px] text-neutral-500'>Automatically switch if usage limit reached</p>
            </div>
            <button
              onClick={() => setAutoSwitch(!autoSwitch)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${autoSwitch ? 'bg-indigo-500' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${autoSwitch ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Keys List */}
          <div className='space-y-3'>
            <label className='block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest'>API Keys ({keys.length})</label>
            <div className='space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar'>
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                    activeKeyId === k.id ?
                      'bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 shadow-sm'
                    : 'bg-neutral-50 dark:bg-neutral-900/20 border-neutral-100 dark:border-neutral-800/40'
                  }`}>
                  <button onClick={() => setActiveKey(k.id)} className='flex-1 text-left'>
                    <div className='flex items-center gap-2'>
                      <p className='text-xs font-semibold text-neutral-900 dark:text-neutral-100'>{k.label}</p>
                      {activeKeyId === k.id && (
                        <span className='px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'>ACTIVE</span>
                      )}
                    </div>
                    <p className='text-[10px] text-neutral-500 tabular-nums font-mono mt-0.5'>
                      {k.key.slice(0, 6)}••••••••{k.key.slice(-4)} • {k.usageByModel[selectedModel] || 0} reqs ({selectedModel.replace('gemini-', '')})
                    </p>
                  </button>
                  <button onClick={() => removeKey(k.id)} className='opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-500 transition-all'>
                    <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {keys.length === 0 && (
                <div className='text-center py-6 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl'>
                  <p className='text-xs text-neutral-400'>No API keys added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Key Form */}
          <form onSubmit={handleAddKey} className='pt-2 space-y-3'>
            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='Label (e.g. My Key)'
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className='flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-400'
              />
              <input
                type='password'
                placeholder='Paste API Key...'
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className='flex-[2] px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-neutral-400'
              />
              <button
                type='submit'
                disabled={!newKey.trim()}
                className='px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50'>
                Add
              </button>
            </div>
            <p className='text-[9px] text-neutral-400 italic'>Keys are stored locally in this browser session only.</p>
          </form>
        </div>
      )}
    </div>
  );
}
