'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className='flex h-dvh w-full bg-[#09090b] text-neutral-100 overflow-hidden'>
      {/* ── Persistent Sidebar (Desktop & Mobile Drawer) ── */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* ── Main Application Area ── */}
      <div className='flex-1 flex flex-col h-full min-w-0 overflow-hidden'>
        {/* Mobile Top Bar */}
        <header className='md:hidden h-14 px-4 flex items-center justify-between border-b border-white/8 bg-[#0c0c0e] shrink-0 z-30'>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className='p-2 -ml-1 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors'
            aria-label='Open Navigation'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16' />
            </svg>
          </button>

          <Link href='/' className='flex items-center gap-2'>
            <div className='w-6 h-6 rounded-md bg-accent flex items-center justify-center text-black font-bold text-xs'>
              R
            </div>
            <span className='font-bold text-sm text-white'>resumate</span>
          </Link>

          <div className='flex items-center gap-1'>
            <Link
              href='/profile'
              className={`p-2 rounded-lg transition-colors ${
                pathname === '/profile' ? 'text-accent bg-accent/10' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title='Profile'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
            </Link>
            <Link
              href='/settings'
              className={`p-2 rounded-lg transition-colors ${
                pathname === '/settings' ? 'text-accent bg-accent/10' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title='Settings'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z' />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className='flex-1 flex flex-col h-full min-w-0 overflow-hidden'>
          {children}
        </main>
      </div>

      {/* ── Global First-Time Onboarding Modal ── */}
      <OnboardingModal />
    </div>
  );
}
