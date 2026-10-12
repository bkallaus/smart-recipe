import { checkApiKey, problem } from '@/helpers/api-response';
import { toSchemaOrgRecipe } from '@/helpers/schema-org-recipe';
import { getFullRecipeById } from '@/server-actions/recipes';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  const { uuid } = await params;
  const recipe = UUID_REGEX.test(uuid) ? await getFullRecipeById(uuid) : null;

  if (!recipe) {
    return problem(404, 'Not found', `No recipe with id "${uuid}".`);
  }

  return Response.json(toSchemaOrgRecipe(recipe, new URL(request.url).origin), {
    headers: { 'Content-Type': 'application/ld+json' },
  });
}
