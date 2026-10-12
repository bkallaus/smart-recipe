export type Recipe = {
  id: number;
  uuid: string;
  name: string;
  description: string;
  primary_image: string;
  category: string;
  cuisine: string;
  keywords: string;
  url: string;
  prep_minutes: number | null;
  cook_minutes: number | null;
  total_minutes: number | null;
  servings: string;
  author: string;
};

export type Steps = {
  label: string;
  text: string;
  section?: string;
  sort: number;
};

export type FullRecipe = Recipe & {
  ingredients: string[];
  steps: Steps[];
  is_favorite: boolean;
};

export type RecipeCard = {
  uuid: string;
  name: string;
  description: string;
};
