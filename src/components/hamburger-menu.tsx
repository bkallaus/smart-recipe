'use client';
import { googleLogout } from '@react-oauth/google';
import { Heart, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { logout } from '@/server-actions/logout';

const itemClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-low))] hover:text-[hsl(var(--primary))] transition-colors duration-200';

const HamburgerMenu = ({ userName }: { userName?: string }) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    setPending(true);
    try {
      await logout();
      // Stop Google One Tap from silently signing the user back in.
      googleLogout();
      router.push('/');
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div ref={containerRef} className='relative'>
      <button
        ref={buttonRef}
        type='button'
        aria-label='Open menu'
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup='true'
        onClick={() => setOpen((curr) => !curr)}
        disabled={pending}
        className='flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-container-low))] transition-colors duration-200'
      >
        <Menu className='h-6 w-6' />
      </button>
      {open ? (
        <div
          id={menuId}
          className='absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-[hsl(var(--surface-container-lowest))] py-1 shadow-[0_12px_32px_rgba(54,50,44,0.06)]'
        >
          {userName ? (
            <div className='px-4 py-3 text-sm font-semibold text-[hsl(var(--on-surface-variant))] bg-[hsl(var(--surface-container-low))] truncate'>
              {userName}
            </div>
          ) : null}
          <Link
            href='/favorite'
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <Heart className='h-5 w-5' />
            Favorite recipes
          </Link>
          <button type='button' className={itemClass} onClick={handleLogout}>
            <LogOut className='h-5 w-5' />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default HamburgerMenu;
