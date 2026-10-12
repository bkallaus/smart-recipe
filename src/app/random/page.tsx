import { requireAccess } from '@/helpers/require-access';
import { getRandomRecipeFilterOptions } from '@/server-actions/random-recipe';
import RandomRecipePicker from './random-recipe-picker';

const RandomRecipePage = async () => {
  await requireAccess('/random');

  const { categories, cuisines } = await getRandomRecipeFilterOptions();

  return (
    <main className='flex min-h-screen flex-col bg-[hsl(var(--surface))]'>
      <section className='bg-[hsl(var(--surface-container-low))] py-14 md:py-20'>
        <div className='px-8 md:px-12 lg:pl-16 lg:pr-8 max-w-4xl'>
          <h1
            className='text-3xl md:text-4xl font-semibold text-[hsl(var(--on-surface))]'
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Surprise Me
          </h1>
          <p className='text-[hsl(var(--on-surface-variant))] mt-2 text-sm'>
            Can&apos;t decide? Narrow it down and let the kitchen pick for you.
          </p>
          <div className='h-10' />
          <RandomRecipePicker categories={categories} cuisines={cuisines} />
        </div>
      </section>
    </main>
  );
};

export default RandomRecipePage;
