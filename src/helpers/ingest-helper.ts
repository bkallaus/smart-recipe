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

type RecipeJson = {
  name: string;
  recipeCuisine: string;
  recipeCategory: string;
  keywords: string;
  headline: string;
  description: string;
  recipeIngredient: string[];
  recipeInstructions: (IngestInstruction | InstructionsWithItems)[];
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
  const sorted = list.sort((a, b) => a.position - b.position);

  return sorted.map(getInstructionFromItem);
};

const getInstructionsWithSection = (recipeJson: RecipeJson): Instruction[] => {
  const stringIngredients = recipeJson.recipeInstructions.flatMap(
    (list: InstructionsWithItems | IngestInstruction) => {
      if (!('itemListElement' in list)) {
        return {
          name: list.name,
          text: list.text,
          position: list.position,
        } as IngestInstruction;
      }

      const section = list.name;

      return list.itemListElement.map(
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

const convertRecipe = (
  recipeJson: RecipeJson,
  originalUrl: string,
): IngestRecipe => {
  const name = recipeJson.name ?? recipeJson.headline;
  const description = recipeJson.description;
  const ingredients = recipeJson.recipeIngredient;
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

export const findRecipeIngredients = (data: any): RecipeJson | null => {
  if (!data) {
    return null;
  }

  if (data.recipeIngredient) {
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

  const mappedRecipe = convertRecipe(foundRecipe as RecipeJson, originalUrl);

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
