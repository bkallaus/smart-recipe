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

type IngestFullInstructions = (IngestInstruction | InstructionsWithItems)[]; // Handle mixed types

type RecipeJson = {
  name: string;
  recipeCuisine: string;
  recipeCategory: string;
  keywords: string;
  headline: string;
  description: string;
  recipeIngredient: string[];
  recipeInstructions: IngestFullInstructions;
  image: string | string[] | { url: string };
  thumbnailUrl: string;
};

const getIntructionsFromArray = (list: IngestInstruction[]) => {
  const sorted = list.sort((a, b) => a.position - b.position);

  return sorted.map((instruction: IngestInstruction) => ({
    label: [instruction.name, instruction.text].filter(Boolean).join(' : '),
    section: instruction.section,
  }));
};

const getInstructionsWithSection = (recipeJson: RecipeJson) => {
  if ('itemListElement' in recipeJson.recipeInstructions[0]) {
    const stringIngredients = (
      recipeJson.recipeInstructions as InstructionsWithItems[]
    ).flatMap((list: InstructionsWithItems) => {
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
    });

    return getIntructionsFromArray(stringIngredients);
  }

  return getIntructionsFromArray(
    recipeJson.recipeInstructions as IngestInstruction[],
  );
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
