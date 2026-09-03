'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGeminiConfig } from '@/hooks/use-gemini-config';
import { useCandidateProfile } from '@/hooks/use-candidate-profile';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function SidebarNavItems({
  onNavClick,
}: {
  onNavClick: (e: React.MouseEvent) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  const { profile } = useCandidateProfile();
  const { keys } = useGeminiConfig();

  const totalProfileItems =
    (profile.skills?.length || 0) +
    (profile.tools?.length || 0);

  const hasApiKey = keys.length > 0;

  const workspaceNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/',
      isActive: pathname === '/',
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
        </svg>
      ),
    },
    {
      id: 'resume',
      label: 'Resume',
      href: '/editor?tab=resume',
      isActive: pathname === '/editor' && currentTab !== 'cover_letter',
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
        </svg>
      ),
    },
    {
      id: 'cover_letter',
      label: 'Cover Letter',
      href: '/editor?tab=cover_letter',
      isActive: pathname === '/editor' && currentTab === 'cover_letter',
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
        </svg>
      ),
    },
    {
      id: 'tailor',
      label: 'Tailor to Job',
      href: '/workspace',
      isActive: pathname === '/workspace',
      badge: 'AI',
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
        </svg>
      ),
    },
  ];

  const systemNavItems = [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      isActive: pathname === '/profile',
      badge: totalProfileItems > 0 ? String(totalProfileItems) : undefined,
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      isActive: pathname === '/settings',
      dot: hasApiKey,
      badge: !hasApiKey ? 'Setup' : undefined,
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z'
          />
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
        </svg>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <div className='px-3 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider'>
          Workspace
        </div>
        {workspaceNavItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavClick}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              item.isActive
                ? 'bg-accent/10 text-accent border border-accent/20 font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            <div className='flex items-center gap-3'>
              <span className={item.isActive ? 'text-accent' : 'text-white/40'}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                  item.isActive ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/50'
                }`}>
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className='space-y-1'>
        <div className='px-3 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider'>
          Guardrails & System
        </div>
        {systemNavItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavClick}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              item.isActive
                ? 'bg-accent/10 text-accent border border-accent/20 font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            <div className='flex items-center gap-3'>
              <span className={item.isActive ? 'text-accent' : 'text-white/40'}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.dot ? (
              <span className='w-2 h-2 rounded-full bg-accent' />
            ) : item.badge ? (
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                  item.badge === 'Setup'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : item.isActive
                    ? 'bg-accent/20 text-accent'
                    : 'bg-white/10 text-white/50'
                }`}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SidebarNavFallback() {
  return (
    <div className='space-y-1'>
      {['Dashboard', 'Resume', 'Cover Letter', 'Tailor to Job', 'Profile', 'Settings'].map((label, idx) => (
        <div key={idx} className='px-3 py-2.5 text-xs text-white/40 rounded-xl'>
          {label}
        </div>
      ))}
    </div>
  );
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const { keys, isDirty, setIsDirty } = useGeminiConfig();
  const { profile } = useCandidateProfile();

  const handleNavClick = (e: React.MouseEvent) => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
      if (!confirmed) {
        e.preventDefault();
        return;
      }
      setIsDirty(false);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const totalProfileItems =
    (profile.skills?.length || 0) +
    (profile.tools?.length || 0);

  const hasApiKey = keys.length > 0;

  const content = (
    <div className='flex flex-col h-full bg-[#0c0c0e] border-r border-white/8 select-none'>
      {/* Brand Header */}
      <div className='h-16 px-5 flex items-center justify-between border-b border-white/8 shrink-0'>
        <Link href='/' onClick={handleNavClick} className='flex items-center gap-3 group'>
          <div className='w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-black shadow-[0_0_15px_rgba(136,255,0,0.3)] transition-transform group-hover:scale-105'>
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M12 2L2 7l10 5 10-5-10-5z' />
              <path d='M2 17l10 5 10-5' />
              <path d='M2 12l10 5 10-5' />
              <circle cx='12' cy='7' r='1' fill='currentColor' />
            </svg>
          </div>
          <div>
            <span className='font-bold text-sm tracking-tight text-white'>resumate</span>
            <span className='block text-[10px] text-white/40 font-medium -mt-0.5'>workspace</span>
          </div>
        </Link>
        {isMobileOpen && (
          <button onClick={onCloseMobile} className='p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        )}
      </div>

      {/* Main Navigation Items */}
      <div className='flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar'>
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNavItems onNavClick={handleNavClick} />
        </Suspense>
      </div>

      {/* Status Footer */}
      <div className='p-3 border-t border-white/8 shrink-0'>
        <div className='p-3 rounded-xl bg-white/2 border border-white/5 space-y-2'>
          <div className='flex items-center justify-between text-[10px]'>
            <span className='text-white/40'>Profile Guard</span>
            <span className={totalProfileItems > 0 ? 'text-green-400 font-medium' : 'text-amber-400/80'}>
              {totalProfileItems > 0 ? `${totalProfileItems} Items` : 'Empty'}
            </span>
          </div>
          <div className='flex items-center justify-between text-[10px]'>
            <span className='text-white/40'>AI Engine</span>
            <span className={hasApiKey ? 'text-accent font-medium flex items-center gap-1' : 'text-white/30'}>
              {hasApiKey && <span className='w-1.5 h-1.5 rounded-full bg-accent animate-pulse' />}
              {hasApiKey ? 'Ready' : 'No Key'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent) */}
      <aside className='hidden md:block w-60 h-full shrink-0'>
        {content}
      </aside>

      {/* Mobile Drawer (slide-over) */}
      {isMobileOpen && (
        <div className='fixed inset-0 z-50 md:hidden flex'>
          <div className='fixed inset-0 bg-black/80 backdrop-blur-sm' onClick={onCloseMobile} />
          <div className='relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200'>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
