'use client';

import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

export default function CookingModeTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);

  // Custom timer state
  const [inputMinutes, setInputMinutes] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(inputMinutes ? parseInt(inputMinutes, 10) * 60 : 0);
  };

  const startCustomTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(inputMinutes, 10);
    if (!Number.isNaN(mins) && mins > 0) {
      setTimeLeft(mins * 60);
      setIsRunning(true);
      setIsOpen(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen && timeLeft === 0 && !isRunning) {
    return (
      <div className='fixed bottom-6 right-6 z-50'>
        <form
          onSubmit={startCustomTimer}
          className='flex gap-2 items-center glass-nav p-2 rounded-full shadow-ambient-md border border-[hsl(var(--outline-variant)/0.2))]'
        >
          <input
            type='number'
            min='1'
            placeholder='Min'
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            className='w-16 px-3 py-2 bg-transparent text-[hsl(var(--on-surface))] outline-none text-center rounded-l-full placeholder-[hsl(var(--on-surface-variant))]'
          />
          <Button
            type='submit'
            size='sm'
            className='rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--on-primary))] hover:bg-[hsl(var(--primary-container))] hover:text-[hsl(var(--on-primary-container))] transition-colors'
          >
            Timer
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300'>
      <div className='glass-nav rounded-3xl p-6 shadow-ambient border border-[hsl(var(--outline-variant)/0.2)] flex flex-col items-center gap-4 min-w-[300px]'>
        <div className='flex justify-between items-center w-full'>
          <span className='text-sm font-medium text-[hsl(var(--on-surface-variant))] uppercase tracking-wider'>
            Cooking Mode
          </span>
          <button
            type='button'
            onClick={() => {
              setIsOpen(false);
              setIsRunning(false);
              setTimeLeft(0);
              setInputMinutes('');
            }}
            className='text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--on-surface))] transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        <div
          className='text-6xl font-bold tracking-tighter text-[hsl(var(--on-surface))] tabular-nums'
          style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
        >
          {formatTime(timeLeft)}
        </div>

        <div className='flex gap-4 w-full justify-center'>
          <Button
            onClick={toggleTimer}
            size='lg'
            className={`rounded-full px-8 ${isRunning ? 'bg-[hsl(var(--surface-container-highest))] text-[hsl(var(--on-surface))] hover:bg-[hsl(var(--surface-container-high))]' : 'gradient-primary text-[hsl(var(--on-primary))]'}`}
          >
            {isRunning ? (
              <Pause className='mr-2' size={20} />
            ) : (
              <Play className='mr-2' size={20} />
            )}
            {isRunning ? 'Pause' : 'Resume'}
          </Button>

          <Button
            onClick={resetTimer}
            variant='outline'
            size='lg'
            className='rounded-full px-6 border-[hsl(var(--outline-variant)/0.2)] hover:bg-[hsl(var(--surface-container-highest))]'
          >
            <RotateCcw size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
