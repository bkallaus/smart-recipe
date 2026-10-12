import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { insertRecipe, getFullRecipeById, listRecipes } = vi.hoisted(() => ({
  insertRecipe: vi.fn(),
  getFullRecipeById: vi.fn(),
  listRecipes: vi.fn(),
}));

vi.mock('@/server-actions/gemini', () => ({ askAI: vi.fn() }));
vi.mock('@/server-actions/recipes', () => ({
  insertRecipe,
  getFullRecipeById,
}));
vi.mock('@/lib/recipe-api', () => ({ listRecipes }));

import { GET, POST } from '@/app/api/v1/recipes/route';

const endpoint = 'https://recipes.example/api/v1/recipes';
const uuid = '6f1c2c1e-1111-4222-8333-444455556666';

const post = (body: unknown, key = 'secret') =>
  POST(
    new Request(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.stubEnv('RECIPE_API_KEYS', 'secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('POST /api/v1/recipes', () => {
  test('rejects a missing or wrong key', async () => {
    const response = await post({}, 'nope');

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toBe(
      'application/problem+json',
    );
    expect(insertRecipe).not.toHaveBeenCalled();
  });

  test('is disabled when no keys are configured', async () => {
    vi.stubEnv('RECIPE_API_KEYS', '');

    expect((await post({})).status).toBe(503);
  });

  test('rejects invalid JSON and invalid recipes', async () => {
    expect((await post('{')).status).toBe(400);

    const response = await post({ '@type': 'Recipe', name: 'X' });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.errors.map((e: { path: string }) => e.path)).toContain(
      'recipeIngredient',
    );
  });

  test('stores a schema.org recipe and returns it', async () => {
    insertRecipe.mockResolvedValue({ uuid });
    getFullRecipeById.mockResolvedValue({
      id: 1,
      uuid,
      name: 'Pie',
      description: '',
      primary_image: '',
      category: 'Dessert',
      cuisine: '',
      keywords: '',
      url: 'https://source.example/pie',
      is_favorite: false,
      ingredients: ['flour'],
      steps: [{ label: 'Bake.', text: 'Bake.', sort: 0 }],
    });

    const response = await post({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: 'Pie',
      isBasedOn: 'https://source.example/pie',
      image: ['https://img.example/pie.jpg'],
      recipeCategory: ['Dessert'],
      recipeIngredient: ['flour'],
      recipeInstructions: [
        { '@type': 'HowToSection', name: 'Bake', itemListElement: ['Bake.'] },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe(
      `https://recipes.example/recipe/${uuid}`,
    );
    expect(insertRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Pie',
        url: 'https://source.example/pie',
        heroImage: 'https://img.example/pie.jpg',
        category: 'Dessert',
        ingredients: ['flour'],
        steps: [{ label: undefined, text: 'Bake.', section: 'Bake' }],
      }),
    );
    expect(await response.json()).toMatchObject({
      '@type': 'Recipe',
      identifier: uuid,
    });
  });
});

describe('GET /api/v1/recipes', () => {
  test('passes search and paging through', async () => {
    listRecipes.mockResolvedValue([{ uuid, name: 'Pie', description: '' }]);

    const response = await GET(
      new Request(`${endpoint}?q=pie&limit=500&offset=10`, {
        headers: { 'X-API-Key': 'secret' },
      }),
    );

    expect(response.status).toBe(200);
    expect(listRecipes).toHaveBeenCalledWith({
      query: 'pie',
      limit: 100,
      offset: 10,
    });
    expect((await response.json()).numberOfItems).toBe(1);
  });
});
