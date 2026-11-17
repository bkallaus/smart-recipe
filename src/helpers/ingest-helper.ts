import { z } from 'zod';
import { askAI } from '@/server-actions/gemini';
import type { IngestRecipe, Instruction } from '@/types/ingest';

type IngestInstruction = {
  name?: unknown;
  text?: unknown;
  position?: unknown;
  section?: string;
};

type InstructionsWithItems = {
  itemListElement: unknown;
  name?: unknown;
};

type RecipeJson = {
  name?: unknown;
  recipeCuisine?: unknown;
  recipeCategory?: unknown;
  keywords?: unknown;
  headline?: unknown;
  description?: unknown;
  recipeIngredient?: unknown;
  // Older (pre-2016) schema.org name for recipeIngredient
  ingredients?: unknown;
  recipeInstructions?: unknown;
  image?: unknown;
  thumbnailUrl?: unknown;
};

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Reads a JSON-LD text value: strings and numbers as-is, lists joined
const toText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join(', ');
  }

  return '';
};

const toList = (value: unknown): unknown[] => {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const toPosition = (value: unknown): number | undefined => {
  const position = typeof value === 'string' ? Number(value) : value;

  return typeof position === 'number' && Number.isFinite(position)
    ? position
    : undefined;
};

const getInstructionFromItem = (
  item: IngestInstruction,
): Instruction | null => {
  const name = toText(item.name);
  const text = toText(item.text);
  const label = name || text;

  if (!label) {
    return null;
  }

  return {
    label,
    section: item.section,
    text: text || label,
  };
};

const getIntructionsFromArray = (list: IngestInstruction[]) => {
  // Keep the page order for steps without a position
  const sorted = list
    .map((item, index) => ({
      item,
      index,
      position: toPosition(item.position),
    }))
    .toSorted(
      (a, b) =>
        (a.position ?? a.index) - (b.position ?? b.index) || a.index - b.index,
    );

  return sorted
    .map(({ item }) => getInstructionFromItem(item))
    .filter((step): step is Instruction => step !== null);
};

const STEP_SPLIT_REGEX = /\r?\n+/;

const toInstruction = (
  step: unknown,
  section?: string,
): IngestInstruction[] => {
  if (typeof step === 'string') {
    return [{ name: step, text: step, section }];
  }

  if (!isObject(step)) {
    return [];
  }

  // A HowToSection: its steps may be HowToStep objects or plain strings
  if ('itemListElement' in step) {
    const sectionName = toText((step as InstructionsWithItems).name) || section;

    return toList(step.itemListElement).flatMap((item) =>
      toInstruction(item, sectionName),
    );
  }

  return [
    {
      name: step.name,
      text: step.text,
      position: step.position,
      section,
    },
  ];
};

const getInstructionsWithSection = (recipeJson: RecipeJson): Instruction[] => {
  const instructions = recipeJson.recipeInstructions;

  if (!instructions) {
    return [];
  }

  // Some recipe plugins emit all steps as one string
  const list =
    typeof instructions === 'string'
      ? instructions
          .split(STEP_SPLIT_REGEX)
          .map((text) => text.trim())
          .filter(Boolean)
      : toList(instructions);

  return getIntructionsFromArray(list.flatMap((step) => toInstruction(step)));
};

const toStringArray = (value: unknown): string[] =>
  toList(value)
    .map((item) =>
      typeof item === 'string' || typeof item === 'number'
        ? String(item).trim()
        : '',
    )
    .filter(Boolean);

const convertRecipe = (
  recipeJson: RecipeJson,
  originalUrl: string,
): IngestRecipe => {
  const name = toText(recipeJson.name) || toText(recipeJson.headline);
  const ingredients = toStringArray(
    recipeJson.recipeIngredient ?? recipeJson.ingredients,
  );
  const steps = getInstructionsWithSection(recipeJson);

  return {
    cuisine: toText(recipeJson.recipeCuisine),
    category: toText(recipeJson.recipeCategory),
    keywords: toText(recipeJson.keywords),
    name,
    url: originalUrl,
    description: toText(recipeJson.description),
    ingredients,
    steps,
  };
};

const isRecipeType = (data: JsonObject): boolean => {
  const type = data['@type'];

  return Array.isArray(type) ? type.includes('Recipe') : type === 'Recipe';
};

export const findRecipeIngredients = (data: unknown): RecipeJson | null => {
  if (!data) {
    return null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeIngredients(item);
      if (found) {
        return found;
      }
    }

    return null;
  }

  if (!isObject(data)) {
    return null;
  }

  if (data.recipeIngredient || (isRecipeType(data) && data.ingredients)) {
    return data as RecipeJson;
  }

  if (data['@graph']) {
    return findRecipeIngredients(data['@graph']);
  }

  return null; // Base case: not found
};

export const convertJsonLdToIngest = async (
  jsonLd: unknown,
  originalUrl: string,
): Promise<IngestRecipe | null> => {
  const foundRecipe = findRecipeIngredients(jsonLd);

  if (!foundRecipe) {
    return null;
  }

  const mappedRecipe = convertRecipe(foundRecipe, originalUrl);

  if (!mappedRecipe.ingredients.length) {
    return null;
  }

  return mappedRecipe;
};

/**
 * Structured recipe data sometimes has no name. Falls back to the page's
 * title and fails with a clear message when there is still none, instead of
 * letting the NOT NULL insert fail.
 */
export const withRecipeName = (
  recipe: IngestRecipe,
  ...fallbackNames: (string | null | undefined)[]
): IngestRecipe => {
  const name = [recipe.name, ...fallbackNames]
    .map((candidate) => toText(candidate))
    .find(Boolean);

  if (!name) {
    throw new Error('The recipe has no name and the page has no title');
  }

  return { ...recipe, name };
};

// Lenient field readers for the model's output: free models often return
// numbers, lists or null where a string is expected
const aiText = z
  .unknown()
  .transform((value) => toText(value))
  .catch('');

const aiIngredient = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim());

const aiStep = z.union([
  z.string().transform((value) => {
    const text = value.trim();
    return { label: text, text };
  }),
  z
    .object({ label: aiText, name: aiText, text: aiText, section: aiText })
    .transform(({ label, name, text, section }): Instruction => {
      const stepLabel = label || name || text;
      return {
        label: stepLabel,
        text: text || stepLabel,
        ...(section ? { section } : {}),
      };
    }),
]);

const aiList = z
  .unknown()
  .transform((value) =>
    typeof value === 'string' ? value.split(STEP_SPLIT_REGEX) : toList(value),
  );

const aiRecipeSchema = z.object({
  category: aiText,
  cuisine: aiText,
  keywords: aiText,
  name: aiText,
  description: aiText,
  url: aiText,
  ingredients: aiList,
  steps: aiList,
});

/**
 * Coerces the model's JSON into an IngestRecipe: trims strings, drops empty or
 * malformed ingredients and steps, and returns null when the recipe has no
 * name or no ingredients.
 */
export const normalizeAiRecipe = (raw: unknown): IngestRecipe | null => {
  const parsed = aiRecipeSchema.safeParse(raw);

  if (!parsed.success) {
    return null;
  }

  const { ingredients, steps, ...fields } = parsed.data;

  const recipe: IngestRecipe = {
    ...fields,
    ingredients: ingredients
      .map((item) => aiIngredient.safeParse(item))
      .flatMap((result) =>
        result.success && result.data ? [result.data] : [],
      ),
    steps: steps
      .map((item) => aiStep.safeParse(item))
      .flatMap((result) =>
        result.success && result.data.label ? [result.data] : [],
      ),
  };

  if (!recipe.name || !recipe.ingredients.length) {
    return null;
  }

  return recipe;
};

const isAiConfigurationError = (error: unknown) =>
  error instanceof Error && error.name === 'AiConfigurationError';

const askAiForRecipe = async (prompt: string): Promise<IngestRecipe | null> => {
  try {
    const result: string = await askAI(prompt);

    // Strip markdown code fences if the model wraps its response (common for free models)
    const cleaned = result
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const recipe = normalizeAiRecipe(JSON.parse(cleaned));

    if (!recipe) {
      console.error(
        'AI response is not a usable recipe:',
        cleaned.slice(0, 500),
      );
    }

    return recipe;
  } catch (error) {
    // A missing API key is a deployment problem, not a page the AI could not read
    if (isAiConfigurationError(error)) {
      throw error;
    }

    console.error(error);
  }
  return null;
};

export const smartIngest = async (
  jsonLd: unknown,
): Promise<IngestRecipe | null> => {
  const prompt: string = `Convert the following jsonld recipe data into a structured JSON format. 

### Instructions:
1.  **Metadata Extraction**: 
    - Extract \`yield\`, \`prepTime\`, \`cookTime\`, and \`totalTime\` if available.
    - Append these details to the start of the \`description\` field in a human-readable format (e.g., "Yield: 4 servings | Prep: 10 mins | Cook: 30 mins").
2.  **Ingredients**:
    - If ingredients are grouped into sections (e.g., "For the crust", "For the filling"), prefix each ingredient with its section name in brackets, like: "[Crust] 1 cup flour".
    - If no sections exist, provide the plain ingredient strings.
3.  **Instructions/Steps**:
    - Ensure steps are sorted correctly by their \`position\`.
    - If steps are grouped by \`InstructionsWithItems.name\`, use that name as the \`section\` field for each step in that group.
4.  **Taxonomy**:
    - Provide a concise \`category\` (e.g., "Dessert"), \`cuisine\` (e.g., "Italian"), and \`keywords\` (comma-separated).
    
### JSONLD Data:
${JSON.stringify(jsonLd)}`;

  return askAiForRecipe(prompt);
};

export const parseRecipeText = async (
  recipeText: string,
): Promise<IngestRecipe | null> => {
  const prompt: string = `Convert the following raw recipe text, pasted by a user from a cookbook, an email or a website, into a structured JSON format.

### Instructions:
1.  **Metadata Extraction**:
    - Extract \`yield\`, \`prepTime\`, \`cookTime\`, and \`totalTime\` if available.
    - Append these details to the start of the \`description\` field in a human-readable format (e.g., "Yield: 4 servings | Prep: 10 mins | Cook: 30 mins").
2.  **Ingredients**:
    - If ingredients are grouped into sections (e.g., "For the crust", "For the filling"), prefix each ingredient with its section name in brackets, like: "[Crust] 1 cup flour".
    - If no sections exist, provide the plain ingredient strings.
3.  **Instructions/Steps**:
    - Keep the steps in the order they appear in the text and strip any leading numbering (e.g. "1.", "Step 2:").
    - If steps are grouped under a heading, use that heading as the \`section\` field for each step in that group.
4.  **Taxonomy**:
    - Provide a concise \`category\` (e.g., "Dessert"), \`cuisine\` (e.g., "Italian"), and \`keywords\` (comma-separated).
5.  **Fidelity**:
    - Only use information present in the text. Never invent ingredients or steps.
    - Ignore unrelated content such as ads, navigation, comments or personal stories.
    - Use an empty string for \`url\` unless a source URL appears in the text.

### Recipe Text:
${recipeText}`;

  return askAiForRecipe(prompt);
};

// Keeps the prompt well within the model's context on very long blog posts
const MAX_PAGE_TEXT_LENGTH = 60000;

const NON_CONTENT_REGEX =
  /<(script|style|noscript|svg|iframe|template|head)\b[^>]*>[\s\S]*?<\/\1>/gi;
const COMMENT_REGEX = /<!--[\s\S]*?-->/g;
const BLOCK_TAG_REGEX =
  /<\/?(p|div|br|li|ul|ol|h[1-6]|tr|td|th|section|article|header|footer|table)\b[^>]*>/gi;
const TAG_REGEX = /<[^>]+>/g;
const ENTITY_REGEX =
  /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|frac12|frac14|frac34|deg);/gi;
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  deg: '°',
};

const MAX_CODE_POINT = 0x10ffff;

// Pages can contain out-of-range references such as &#x110000; which would
// make String.fromCodePoint throw and abort the whole import
const fromCodePoint = (codePoint: number) => {
  const isSurrogate = codePoint >= 0xd800 && codePoint <= 0xdfff;

  if (
    !Number.isInteger(codePoint) ||
    codePoint <= 0 ||
    codePoint > MAX_CODE_POINT ||
    isSurrogate
  ) {
    return '';
  }

  return String.fromCodePoint(codePoint);
};

const decodeEntity = (_match: string, entity: string) => {
  const lower = entity.toLowerCase();

  if (lower.startsWith('#x')) {
    return fromCodePoint(Number.parseInt(lower.slice(2), 16));
  }

  if (lower.startsWith('#')) {
    return fromCodePoint(Number.parseInt(lower.slice(1), 10));
  }

  return NAMED_ENTITIES[lower] ?? '';
};

/**
 * Reduces a recipe page's HTML to readable text, for pages whose recipe card
 * has no JSON-LD (e.g. older microdata-only recipe plugins).
 */
export const htmlToRecipeText = (html: string): string => {
  const text = html
    .replace(NON_CONTENT_REGEX, ' ')
    .replace(COMMENT_REGEX, ' ')
    .replace(BLOCK_TAG_REGEX, '\n')
    .replace(TAG_REGEX, ' ')
    .replace(ENTITY_REGEX, decodeEntity)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return text.slice(0, MAX_PAGE_TEXT_LENGTH);
};
