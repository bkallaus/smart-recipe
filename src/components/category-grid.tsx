import Link from 'next/link';
import type { RecipeCategory } from '@/types/recipe';

const CategoryGrid = ({ categories }: { categories: RecipeCategory[] }) => {
  if (categories.length === 0) {
    return (
      <p className='text-sm text-[hsl(var(--on-surface-variant))]'>
        No categories yet. Add a category to a recipe to see it here.
      </p>
    );
  }

  return (
    <ul className='flex flex-wrap gap-3'>
      {categories.map((category) => (
        <li key={category.slug}>
          <Link
            href={`/category/${category.slug}`}
            className='inline-block rounded-full bg-[hsl(var(--surface-container-lowest))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--on-surface))] transition-all duration-200 hover:-translate-y-0.5 hover:text-[hsl(var(--primary))] hover:shadow-ambient-md'
            style={{ boxShadow: '0 4px 12px hsl(var(--on-surface) / 0.05)' }}
          >
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default CategoryGrid;
