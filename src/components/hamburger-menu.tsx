'use client';
import { Heart, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { disableGoogleAutoSelect } from '@/lib/google-auto-select';
import { logout } from '@/server-actions/logout';

const itemClassName =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--on-surface))] transition-colors duration-200 hover:bg-[hsl(var(--surface-container-low))] hover:text-[hsl(var(--primary))]';

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const router = useRouter();

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

  const handleLogout = async () => {
    setOpen(false);
    await disableGoogleAutoSelect();
    await logout();
    router.replace('/');
    router.refresh();
  };

  return (
    <div ref={containerRef} className='relative'>
      <button
        ref={buttonRef}
        type='button'
        aria-label='Main menu'
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className='flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--on-surface-variant))] transition-colors duration-200 hover:bg-[hsl(var(--surface-container))] hover:text-[hsl(var(--primary))]'
      >
        <Menu className='h-5 w-5' />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className='absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl bg-[hsl(var(--surface-container-lowest))] p-2 shadow-[0_12px_32px_rgba(54,50,44,0.06)]'
      >
        <Link
          href='/favorite'
          onClick={() => setOpen(false)}
          className={itemClassName}
        >
          <Heart className='h-4 w-4' />
          Favorite recipes
        </Link>
        <button type='button' onClick={handleLogout} className={itemClassName}>
          <LogOut className='h-4 w-4' />
          Log out
        </button>
      </div>
    </div>
  );
};

export default HamburgerMenu;
