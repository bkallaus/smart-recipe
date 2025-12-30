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
  recipeCuisine: string | string[];
  recipeCategory: string | string[];
  keywords: string | string[];
  headline: string;
  description: string;
  recipeIngredient: string[];
  recipeInstructions: (IngestInstruction | InstructionsWithItems)[];
  image: string | string[] | { url: string };
  thumbnailUrl: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
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
    ? recipeJson.recipeCuisine
    : recipeJson.recipeCuisine ? [recipeJson.recipeCuisine] : [];

  const category = Array.isArray(recipeJson.recipeCategory)
    ? recipeJson.recipeCategory
    : recipeJson.recipeCategory ? [recipeJson.recipeCategory] : [];

  const keywords = Array.isArray(recipeJson.keywords)
    ? recipeJson.keywords
    : recipeJson.keywords ? [recipeJson.keywords] : [];

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
    prepTime: recipeJson.prepTime,
    cookTime: recipeJson.cookTime,
    totalTime: recipeJson.totalTime,
    recipeYield: recipeJson.recipeYield,
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

export const smartIngest = async (
  jsonLd: any,
): Promise<IngestRecipe | null> => {
  const prompt: string = `Convert the following recipe data to a standardized JSON format.

  Please extract the following fields if available:
  - Name, Description, Hero Image URL, URL
  - Cuisine (list of strings), Category (list of strings), Keywords (list of strings)
  - Ingredients (list of strings)
  - Steps (list of objects with label, text, section). Sort ingredients into correct sections if applicable.
  - Prep Time, Cook Time, Total Time (in ISO 8601 duration format if possible, e.g., PT1H)
  - Recipe Yield (e.g., "4 servings")

  Here is the data:
  ${JSON.stringify(jsonLd)}
  `;

  try {
    const result: string = await askAI(prompt);

    const parsed = JSON.parse(result);

    return parsed;
  } catch (error) {
    console.error(error);
  }
  return null;
};
