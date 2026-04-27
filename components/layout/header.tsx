'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useGeminiConfig} from '@/hooks/use-gemini-config';

export function Header() {
  const pathname = usePathname();
  const {isDirty, setIsDirty} = useGeminiConfig();

  const handleNavigation = (e: React.MouseEvent) => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave? Your progress will be lost.');
      if (!confirmed) {
        e.preventDefault();
        return;
      }
      setIsDirty(false); // Clear dirty state if they confirm
    }
  };

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={(e) => handleNavigation(e)}
        className={[
          'relative text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 px-4 py-2 rounded-xl',
          active ? 'text-accent bg-accent/10 border border-accent/20' : 'text-white/40 hover:text-white/80 hover:bg-white/5',
        ].join(' ')}>
        {label}
      </Link>
    );
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-white/5 bg-black/20 backdrop-blur-xl shrink-0'>
      <div className='flex h-14 items-center justify-between px-6 w-full mx-auto'>
        <Link href='/' onClick={(e) => handleNavigation(e)} className='flex items-center gap-2.5 group'>
          <div className='w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black shadow-[0_0_20px_rgba(136,255,0,0.4)] group-hover:scale-105 group-hover:rotate-6 transition-all duration-500'>
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M12 2L2 7l10 5 10-5-10-5z' />
              <path d='M2 17l10 5 10-5' />
              <path d='M2 12l10 5 10-5' />
              <circle cx='12' cy='7' r='1' fill='currentColor' />
            </svg>
          </div>
          <span className='font-black text-lg tracking-tighter text-white'>resumate</span>
        </Link>

        <nav className='flex items-center gap-3'>
          {navLink('/editor', 'Editor')}
          {navLink('/workspace', 'Transformer')}
        </nav>
      </div>
    </header>
  );
}
