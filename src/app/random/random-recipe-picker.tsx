'use client';
import { Dices, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { titleCase } from 'title-case';
import { Button } from '@/components/ui/button';
import { pickRandomRecipe } from '@/server-actions/random-recipe';
import type { RandomRecipeFilters, RecipeCard } from '@/types/recipe';

const fieldClassName =
  'w-full px-4 py-3 text-sm rounded-xl bg-[hsl(var(--surface-container-lowest))] text-[hsl(var(--on-surface))] placeholder-[hsl(var(--on-surface-variant))] outline-none border-0 border-b-2 border-[hsl(var(--outline-variant)/0.3)] focus:border-[hsl(var(--primary))] focus:ring-0 transition-colors duration-200';

const labelClassName =
  'block mb-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--on-surface-variant))]';

const RandomRecipePicker = ({
  categories,
  cuisines,
}: {
  categories: string[];
  cuisines: string[];
}) => {
  const [filters, setFilters] = useState<RandomRecipeFilters>({});
  const [recipe, setRecipe] = useState<RecipeCard | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateFilter = <K extends keyof RandomRecipeFilters>(
    key: K,
    value: RandomRecipeFilters[K],
  ) => setFilters((curr) => ({ ...curr, [key]: value }));

  const pick = () => {
    startTransition(async () => {
      const result = await pickRandomRecipe(filters, recipe?.uuid);
      setRecipe(result);
      setNoMatch(!result);
    });
  };

  const hasFilters = Boolean(
    filters.category ||
      filters.cuisine ||
      filters.ingredient?.trim() ||
      filters.favoritesOnly,
  );

  return (
    <div className='space-y-10'>
      <form
        className='grid gap-6 md:grid-cols-2'
        onSubmit={(e) => {
          e.preventDefault();
          pick();
        }}
      >
        <div>
          <label htmlFor='random-category' className={labelClassName}>
            Category
          </label>
          <select
            id='random-category'
            className={fieldClassName}
            value={filters.category ?? ''}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value=''>Any category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor='random-cuisine' className={labelClassName}>
            Cuisine
          </label>
          <select
            id='random-cuisine'
            className={fieldClassName}
            value={filters.cuisine ?? ''}
            onChange={(e) => updateFilter('cuisine', e.target.value)}
          >
            <option value=''>Any cuisine</option>
            {cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor='random-ingredient' className={labelClassName}>
            Includes ingredient
          </label>
          <input
            id='random-ingredient'
            type='text'
            placeholder='e.g. chicken'
            className={fieldClassName}
            value={filters.ingredient ?? ''}
            onChange={(e) => updateFilter('ingredient', e.target.value)}
          />
        </div>

        <div className='flex items-end'>
          <label className='flex items-center gap-3 py-3 text-sm text-[hsl(var(--on-surface))] cursor-pointer'>
            <input
              type='checkbox'
              className='h-4 w-4 rounded text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]'
              checked={filters.favoritesOnly ?? false}
              onChange={(e) => updateFilter('favoritesOnly', e.target.checked)}
            />
            Only my favorites
          </label>
        </div>

        <div className='md:col-span-2 flex flex-wrap items-center gap-4'>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Dices className='mr-2 h-4 w-4' />
            )}
            {recipe ? 'Pick again' : 'Pick a recipe'}
          </Button>
          {hasFilters ? (
            <Button
              type='button'
              variant='ghost'
              onClick={() => setFilters({})}
              disabled={isPending}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </form>

      {noMatch ? (
        <p className='text-sm text-[hsl(var(--on-surface-variant))]'>
          No recipes match those filters. Try loosening them a little.
        </p>
      ) : null}

      {recipe ? (
        <Link
          href={`/recipe/${recipe.uuid}`}
          className='block bg-[hsl(var(--surface-container-lowest))] p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-ambient-md'
          style={{ boxShadow: '0 8px 24px hsl(var(--on-surface) / 0.05)' }}
        >
          <p className='text-xs font-semibold uppercase tracking-wide text-[hsl(var(--primary))]'>
            Tonight&apos;s pick
          </p>
          <h2
            className='text-2xl md:text-3xl font-semibold mt-2 mb-3 text-[hsl(var(--on-surface))]'
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            {titleCase(recipe.name)}
          </h2>
          <p className='line-clamp-4 text-sm leading-relaxed text-[hsl(var(--on-surface-variant))]'>
            {recipe.description}
          </p>
        </Link>
      ) : null}
    </div>
  );
};

export default RandomRecipePicker;
