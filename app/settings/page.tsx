import { Metadata } from 'next';
import { GeminiConfigPanel } from '@/components/ai/gemini-config-panel';

export const metadata: Metadata = {
  title: 'Settings & Security | Resumate',
  description: 'Manage Gemini AI model configurations, API keys, storage expiration policies, and local data.',
};

export default function SettingsPage() {
  return (
    <div className='flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden'>
      {/* ── Top Header ── */}
      <div className='h-14 px-6 sm:px-8 border-b border-white/8 bg-[#0c0c0e] flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='w-2 h-2 rounded-full bg-accent animate-pulse' />
          <div>
            <h1 className='text-sm font-bold text-white tracking-tight'>
              Settings
            </h1>
          </div>
        </div>
        <span className='text-xs text-white/40'>AI Models & Local Storage</span>
      </div>

      {/* ── Main Full-Page Content ── */}
      <div className='flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10'>
        <div className='max-w-4xl mx-auto space-y-8'>
          <div className='space-y-1.5'>
            <h2 className='text-2xl font-bold text-white tracking-tight'>
              AI Configuration & Data Privacy
            </h2>
            <p className='text-xs sm:text-sm text-white/50 leading-relaxed max-w-2xl'>
              Configure Google Gemini API credentials, select your preferred model, and manage browser storage. Keys are stored locally and auto-expire in 30 days.
            </p>
          </div>

          <GeminiConfigPanel />
        </div>
      </div>
    </div>
  );
}
