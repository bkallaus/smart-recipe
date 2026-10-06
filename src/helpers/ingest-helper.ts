import { askAI } from '@/server-actions/gemini';
import type { IngestRecipe, Instruction } from '@/types/ingest';

type IngestInstruction = {
  name: string;
  text: string;
  position: number;
  section?: string;
};

type InstructionsWithItems = {
  itemListElement: IngestInstruction[];
  name: string;
};

type RecipeInstructions =
  | string
  | (string | IngestInstruction | InstructionsWithItems)[];

type RecipeJson = {
  name: string;
  recipeCuisine: string;
  recipeCategory: string;
  keywords: string;
  headline: string;
  description: string;
  recipeIngredient: string | string[];
  // Older (pre-2016) schema.org name for recipeIngredient
  ingredients?: string | string[];
  recipeInstructions?: RecipeInstructions;
  image: string | string[] | { url: string };
  thumbnailUrl: string;
};

const getInstructionFromItem = (item: IngestInstruction): Instruction => {
  return {
    label: item.name,
    section: item.section,
    text: item.text,
  };
};

const getIntructionsFromArray = (list: IngestInstruction[]) => {
  // Keep the page order for steps without a position
  const sorted = list
    .map((item, index) => ({ item, index }))
    .toSorted(
      (a, b) =>
        (a.item.position ?? a.index) - (b.item.position ?? b.index) ||
        a.index - b.index,
    );

  return sorted.map(({ item }) => getInstructionFromItem(item));
};

const STEP_SPLIT_REGEX = /\r?\n+/;

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
      : instructions;

  const stringIngredients = list.flatMap(
    (step: string | InstructionsWithItems | IngestInstruction) => {
      if (typeof step === 'string') {
        return { name: step, text: step } as IngestInstruction;
      }

      if (!('itemListElement' in step)) {
        return {
          name: step.name,
          text: step.text,
          position: step.position,
        } as IngestInstruction;
      }

      const section = step.name;

      return step.itemListElement.map(
        (item: IngestInstruction) =>
          ({
            name: item.name,
            text: item.text,
            position: item.position,
            section,
          }) as IngestInstruction,
      );
    },
  );

  return getIntructionsFromArray(stringIngredients);
};

const toStringArray = (value: string | string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const convertRecipe = (
  recipeJson: RecipeJson,
  originalUrl: string,
): IngestRecipe => {
  const name = recipeJson.name ?? recipeJson.headline;
  const description = recipeJson.description;
  const ingredients = toStringArray(
    recipeJson.recipeIngredient ?? recipeJson.ingredients,
  );
  const steps = getInstructionsWithSection(recipeJson);

  const image = Array.isArray(recipeJson.image)
    ? recipeJson.image[0]
    : recipeJson.image;

  const cuisine = Array.isArray(recipeJson.recipeCuisine)
    ? recipeJson.recipeCuisine.join(', ')
    : recipeJson.recipeCuisine;

  const category = Array.isArray(recipeJson.recipeCategory)
    ? recipeJson.recipeCategory.join(', ')
    : recipeJson.recipeCategory;

  const keywords = Array.isArray(recipeJson.keywords)
    ? recipeJson.keywords.join(', ')
    : recipeJson.keywords;
  return {
    cuisine,
    category,
    keywords,
    heroImage: typeof image === 'object' ? image.url : image,
    name,
    url: originalUrl,
    description,
    ingredients,
    steps,
  };
};

const isRecipeType = (data: { '@type'?: unknown }): boolean => {
  const type = data['@type'];

  return Array.isArray(type) ? type.includes('Recipe') : type === 'Recipe';
};

export const findRecipeIngredients = (data: any): RecipeJson | null => {
  if (!data) {
    return null;
  }

  if (data.recipeIngredient || (isRecipeType(data) && data.ingredients)) {
    return data;
  }

  if (data['@graph']) {
    return findRecipeIngredients(data['@graph']);
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const found = findRecipeIngredients(data[i]);
      if (found) {
        return found;
      }
    }
  }

  return null; // Base case: not found
};

export const convertJsonLdToIngest = async (
  jsonLd: any,
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

const askAiForRecipe = async (prompt: string): Promise<IngestRecipe | null> => {
  try {
    const result: string = await askAI(prompt);

    // Strip markdown code fences if the model wraps its response (common for free models)
    const cleaned = result
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error(error);
  }
  return null;
};

export const smartIngest = async (
  jsonLd: any,
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
    - Use an empty string for \`heroImage\`, and for \`url\` unless a source URL appears in the text.

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
const ENTITY_REGEX = /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|frac12|frac14|frac34|deg);/gi;
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

const decodeEntity = (_match: string, entity: string) => {
  const lower = entity.toLowerCase();

  if (lower.startsWith('#x')) {
    return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
  }

  if (lower.startsWith('#')) {
    return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
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
