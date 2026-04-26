'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={[
          'relative text-sm font-medium transition-colors duration-150 px-1 py-0.5',
          active ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
        ].join(' ')}>
        {label}
        {active && <span className='absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full' />}
      </Link>
    );
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-neutral-200/50 dark:border-neutral-800/50 bg-[#f8f8f8]/85 dark:bg-[#0d0d0d]/85 backdrop-blur-md shrink-0'>
      <div className='flex h-13 items-center justify-between px-6 w-full mx-auto'>
        <Link href='/' className='flex items-center gap-2.5 group'>
          <div className='bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-md p-1.5 group-hover:scale-105 transition-transform shadow-sm'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.5'
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.ws293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'></path>
            </svg>
          </div>
          <span className='font-bold text-[15px] tracking-tight text-neutral-900 dark:text-neutral-100'>resumate</span>
        </Link>

        <nav className='flex items-center gap-6'>
          {navLink('/editor', 'Base Editor')}
          {navLink('/workspace', 'Transformer')}
        </nav>
      </div>
    </header>
  );
}
