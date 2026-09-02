'use client';

import React, {useState} from 'react';
import {useGeminiConfig} from '@/hooks/use-gemini-config';
import {GEMINI_MODELS} from '@/constants/models';
import {resetOnboarding} from '@/components/onboarding/onboarding-modal';

type SettingsTab = 'keys' | 'models' | 'privacy';

function formatDaysRemaining(expiresAt: number): string {
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'Expired';

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
}

export function GeminiConfigPanel() {
  const {keys, activeKeyId, selectedModel, autoSwitch, isLoaded, addKey, removeKey, setActiveKey, setModel, setAutoSwitch, clearAllData} = useGeminiConfig();

  const [activeTab, setActiveTab] = useState<SettingsTab>('keys');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isLoaded) return null;

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    addKey(newKey.trim(), newLabel.trim());
    setNewKey('');
    setNewLabel('');
  };

  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirm(false);
    window.location.reload();
  };

  const tabs: {id: SettingsTab; label: string; count?: number; description: string}[] = [
    {
      id: 'keys',
      label: 'API Keys',
      count: keys.length,
      description: 'Manage Google Gemini API credentials. All keys are stored in your browser with a 30-day default expiration.',
    },
    {
      id: 'models',
      label: 'AI Models',
      count: GEMINI_MODELS.length,
      description: 'Select your preferred Google Gemini inference model and configure auto-redundancy limits.',
    },
    {
      id: 'privacy',
      label: 'Data & Privacy',
      description: 'Control browser local storage, reset all saved drafts and credentials, or restart the tutorial.',
    },
  ];

  const currentTabMeta = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className='space-y-6 select-none'>
      {/* ── Settings Pill Tabs (identical to Profile Tabs) ── */}
      <div className='grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
              activeTab === tab.id ? 'bg-accent text-black shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}>
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/40'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Description Banner */}
      <div className='p-3.5 rounded-xl bg-white/2 border border-white/5 flex items-start gap-3'>
        <div className='w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0' />
        <div className='space-y-0.5'>
          <p className='text-xs text-white/80 font-medium'>{currentTabMeta.description}</p>
          {activeTab === 'keys' && (
            <p className='text-[11px] text-white/40'>Default policy: 30 days expiration. Keys are stored locally in your browser and never transmitted to Resumate servers.</p>
          )}
        </div>
      </div>

      {/* ── Tab 1: API Keys ── */}
      {activeTab === 'keys' && (
        <div className='space-y-5'>
          {/* Add Key Form */}
          <form onSubmit={handleAddKey} className='p-4 rounded-xl bg-[#121215] border border-white/8 space-y-3'>
            <span className='text-xs font-bold text-white uppercase tracking-wider block'>Add Gemini API Key</span>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              <input
                type='text'
                placeholder='Label (e.g. Personal Gemini Key)…'
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none'
              />
              <input
                type='password'
                placeholder='API Key (AIzaSy…)…'
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className='w-full px-3.5 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-accent/40 text-white placeholder:text-white/20 outline-none font-mono'
              />
            </div>

            <div className='flex items-center justify-between pt-1'>
              <span className='text-[11px] text-white/40'>Auto-stored for 30 days in browser storage</span>
              <button
                type='submit'
                disabled={!newKey.trim()}
                className='px-5 py-2 bg-accent text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-30'>
                Save Key
              </button>
            </div>
          </form>

          {/* Keys List */}
          <div className='space-y-2.5'>
            {keys.map((k) => {
              const isActive = activeKeyId === k.id;
              const daysLeft = formatDaysRemaining(k.expiresAt);

              return (
                <div
                  key={k.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive ? 'bg-[#18181d] border-accent/40 shadow-md' : 'bg-[#121215] border-white/8 hover:border-white/15'
                  }`}>
                  <div className='flex items-center gap-3 min-w-0'>
                    <button
                      type='button'
                      onClick={() => setActiveKey(k.id)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isActive ? 'border-accent bg-accent/20' : 'border-white/20 hover:border-white/40'
                      }`}
                      title={isActive ? 'Active Key' : 'Set as Active Key'}>
                      {isActive && <span className='w-2 h-2 rounded-full bg-accent' />}
                    </button>

                    <div className='space-y-0.5 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold text-white truncate'>{k.label || 'API Key'}</span>
                        {isActive && <span className='px-1.5 py-0.2 rounded text-[9px] font-bold bg-accent/10 text-accent border border-accent/20'>Active</span>}
                      </div>
                      <div className='flex items-center gap-3 text-[11px] text-white/40 font-mono'>
                        <span>
                          {k.key.slice(0, 4)}••••{k.key.slice(-4)}
                        </span>
                        <span>•</span>
                        <span>{Object.values(k.usageByModel).reduce((a, b) => a + b, 0)} calls</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 self-end sm:self-center shrink-0'>
                    <span className='text-[11px] font-medium text-cyan-400/90 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg'>{daysLeft}</span>

                    <button
                      type='button'
                      onClick={() => removeKey(k.id)}
                      className='p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                      title='Delete Key'>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {keys.length === 0 && (
              <div className='py-8 text-center rounded-xl bg-white/1 border border-dashed border-white/10'>
                <p className='text-xs text-white/30'>No API keys added yet. Add a key above to enable AI tailoring.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: AI Models ── */}
      {activeTab === 'models' && (
        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-2.5'>
            {GEMINI_MODELS.map((m) => {
              const activeKey = keys.find((k) => k.id === activeKeyId);
              const usage = activeKey?.usageByModel[m.id] || 0;
              const isAtLimit = usage >= m.limit;
              const isSelected = selectedModel === m.id;

              return (
                <button
                  key={m.id}
                  type='button'
                  onClick={() => setModel(m.id)}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected ? 'bg-accent/10 border-accent/40 text-white shadow-md' : 'bg-[#121215] border-white/8 text-white/60 hover:text-white hover:border-white/15'
                  }`}>
                  <div className='flex items-center gap-3'>
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-accent animate-pulse' : 'bg-white/20'}`} />
                    <div>
                      <span className='text-xs font-bold block text-white'>{m.name}</span>
                      <span className='text-[11px] text-white/40'>20 requests per model quota</span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {isAtLimit && <span className='text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded'>Quota Reached</span>}
                    <span className='text-xs font-mono text-white/50 tabular-nums'>{usage}/20</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Model Redundancy Card */}
          <div className='p-4 rounded-xl bg-[#121215] border border-white/8 flex items-center justify-between'>
            <div className='space-y-0.5'>
              <span className='text-xs font-bold text-white block'>Dynamic Redundancy</span>
              <span className='text-[11px] text-white/40'>Automatically switch to another non-exhausted Gemini model if quota limit is reached.</span>
            </div>
            <button
              type='button'
              onClick={() => setAutoSwitch(!autoSwitch)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${autoSwitch ? 'bg-accent' : 'bg-white/15'}`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 mt-0.5 ml-0.5 ${autoSwitch ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 3: Data Privacy ── */}
      {activeTab === 'privacy' && (
        <div className='space-y-4'>
          {/* Tutorial Reset Card */}
          <div className='p-4 rounded-xl bg-[#121215] border border-white/8 flex items-center justify-between'>
            <div className='space-y-0.5'>
              <span className='text-xs font-bold text-white block'>Onboarding Tutorial</span>
              <span className='text-[11px] text-white/40'>Re-display the first-time onboarding guide and feature walk-through.</span>
            </div>
            <button
              type='button'
              onClick={() => {
                resetOnboarding();
                window.location.reload();
              }}
              className='px-3.5 py-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all'>
              Restart Tutorial
            </button>
          </div>

          {/* Danger Zone Card */}
          <div className='p-5 rounded-xl bg-red-950/10 border border-red-500/20 space-y-3'>
            <div className='space-y-0.5'>
              <span className='text-xs font-bold text-red-400 block uppercase tracking-wider'>Clear Local Data</span>
              <p className='text-xs text-white/60 leading-relaxed'>
                Safely wipe all Resumate-owned data including Candidate Profile records, API keys, resume drafts, and job target history from your browser.
              </p>
            </div>

            <button
              type='button'
              onClick={() => setShowClearConfirm(true)}
              className='px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold rounded-lg transition-all flex items-center gap-2'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
              <span>Clear All Resumate Local Data</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showClearConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm'>
          <div className='w-full max-w-sm bg-[#18181d] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4'>
            <div className='flex items-center gap-3 text-red-400'>
              <div className='p-2 bg-red-500/10 rounded-xl'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
              </div>
              <h3 className='text-sm font-bold text-white'>Reset Resumate Data?</h3>
            </div>

            <p className='text-xs text-white/60 leading-relaxed'>
              This will remove all saved API keys, Candidate Profile entries, resume drafts, and job target history owned by Resumate.
            </p>

            <div className='flex items-center justify-end gap-2 pt-2'>
              <button
                type='button'
                onClick={() => setShowClearConfirm(false)}
                className='px-3.5 py-1.5 text-xs font-semibold text-white/60 hover:text-white rounded-lg transition-colors'>
                Cancel
              </button>
              <button
                type='button'
                onClick={handleClearAll}
                className='px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95'>
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
