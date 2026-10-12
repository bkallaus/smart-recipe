import { checkApiKey, problem } from '@/helpers/api-response';
import { convertJsonLdToIngest } from '@/helpers/ingest-helper';
import {
  recipePageUrl,
  type SchemaOrgRecipeInput,
  schemaOrgRecipeInput,
  toSchemaOrgItemList,
  toSchemaOrgRecipe,
} from '@/helpers/schema-org-recipe';
import { listRecipes } from '@/lib/recipe-api';
import { getFullRecipeById, insertRecipe } from '@/server-actions/recipes';

const MAX_BODY_BYTES = 1_000_000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const readInt = (value: string | null, fallback: number, max: number) => {
  const parsed = Number.parseInt(value ?? '', 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

export async function GET(request: Request) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { searchParams, origin } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || undefined;
  const limit = readInt(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const offset = readInt(
    searchParams.get('offset'),
    0,
    Number.MAX_SAFE_INTEGER,
  );

  const recipes = await listRecipes({ query, limit: limit || 1, offset });

  return Response.json(toSchemaOrgItemList(recipes, origin), {
    headers: { 'Content-Type': 'application/ld+json' },
  });
}

// Bare strings inside a HowToSection carry no name/text for the converter
const normalizeInstructions = (input: SchemaOrgRecipeInput) => {
  if (typeof input.recipeInstructions === 'string') {
    return input.recipeInstructions;
  }

  return input.recipeInstructions.map((step) =>
    typeof step === 'object' && 'itemListElement' in step
      ? {
          ...step,
          itemListElement: step.itemListElement.map((item) =>
            typeof item === 'string' ? { text: item } : item,
          ),
        }
      : step,
  );
};

export async function POST(request: Request) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const body = await request.text();

  if (body.length > MAX_BODY_BYTES) {
    return problem(413, 'Payload too large', 'Request body exceeds 1 MB.');
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return problem(400, 'Invalid JSON', 'The request body is not valid JSON.');
  }

  const parsed = schemaOrgRecipeInput.safeParse(json);

  if (!parsed.success) {
    return problem(
      422,
      'Invalid recipe',
      'The body must be a schema.org Recipe with name, recipeIngredient and recipeInstructions.',
      {
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    );
  }

  const input = parsed.data;
  const ingest = await convertJsonLdToIngest(
    {
      ...input,
      description: input.description ?? '',
      recipeInstructions: normalizeInstructions(input),
    },
    input.isBasedOn ?? input.url ?? '',
  );

  if (!ingest?.steps.length) {
    return problem(
      422,
      'Invalid recipe',
      'The recipe needs at least one ingredient and one instruction with text.',
    );
  }

  const inserted = await insertRecipe({
    ...ingest,
    heroImage: ingest.heroImage ?? '',
  });

  const recipe = inserted ? await getFullRecipeById(inserted.uuid) : null;

  if (!recipe) {
    return problem(500, 'Insert failed', 'The recipe could not be saved.');
  }

  const { origin } = new URL(request.url);

  return Response.json(toSchemaOrgRecipe(recipe, origin), {
    status: 201,
    headers: {
      'Content-Type': 'application/ld+json',
      Location: recipePageUrl(origin, recipe.uuid),
    },
  });
}
