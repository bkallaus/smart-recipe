'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const IngredientsChecklist = ({ ingredients }: { ingredients: string[] }) => {
  const [doneIndices, setDoneIndices] = useState<Set<number>>(() => new Set());

  const toggleIngredient = (index: number) => {
    setDoneIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className='space-y-6'>
      {ingredients.map((ingredient, index) => {
        const isDone = doneIndices.has(index);
        return (
          <button
            key={`ingredient-${index}`}
            type='button'
            aria-pressed={isDone}
            onClick={() => toggleIngredient(index)}
            className='group flex w-full items-start gap-4 text-left text-lg cursor-pointer select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2'
          >
            <span
              aria-hidden='true'
              className={cn(
                'shrink-0 w-2 h-2 mt-2.5 rounded-full bg-[hsl(var(--secondary))] transition-opacity',
                isDone ? 'opacity-25' : 'opacity-60 group-hover:opacity-100',
              )}
            />
            <span
              className={cn(
                'text-[hsl(var(--on-surface))] transition-colors',
                isDone &&
                  'line-through text-[hsl(var(--on-surface-variant))] opacity-60',
              )}
            >
              {ingredient}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default IngredientsChecklist;
