'use client';
import { googleLogout } from '@react-oauth/google';
import { Heart, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { logout } from '@/server-actions/auth';

const itemClassName =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-low))] hover:text-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] transition-colors duration-200 disabled:opacity-60';

const HamburgerMenu = ({ userName }: { userName: string }) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const onLogout = () => {
    startTransition(async () => {
      await logout();
      // Stop Google One Tap from silently signing the user straight back in.
      googleLogout();
      setOpen(false);
      router.push('/');
      router.refresh();
    });
  };

  return (
    <div ref={containerRef} className='relative'>
      <button
        ref={buttonRef}
        type='button'
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup='true'
        onClick={() => setOpen((curr) => !curr)}
        className='flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--on-surface-variant))] hover:bg-[hsl(var(--surface-container-low))] hover:text-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] transition-colors duration-200'
      >
        {open ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
      </button>
      {open ? (
        <div
          id={menuId}
          className='absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-[hsl(var(--surface-container-lowest))] p-2 shadow-[0_12px_32px_rgba(54,50,44,0.06)] ring-1 ring-[hsl(var(--outline-variant)/0.15)]'
        >
          <div className='px-3 pt-2 pb-3'>
            <p className='text-xs font-medium uppercase tracking-wide text-[hsl(var(--on-surface-variant))]'>
              Signed in as
            </p>
            <p className='truncate text-sm font-semibold text-[hsl(var(--on-surface))]'>
              {userName}
            </p>
          </div>
          <ul className='flex flex-col gap-1'>
            <li>
              <Link
                href='/favorite'
                className={itemClassName}
                onClick={() => setOpen(false)}
              >
                <Heart className='h-4 w-4' />
                Favorite recipes
              </Link>
            </li>
            <li>
              <button
                type='button'
                className={itemClassName}
                onClick={onLogout}
                disabled={isPending}
              >
                <LogOut className='h-4 w-4' />
                {isPending ? 'Logging out…' : 'Log out'}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default HamburgerMenu;
