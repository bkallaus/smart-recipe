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
};

export type Steps = {
  label: string;
  section?: string;
  sort: number;
};

export type FullRecipe = Recipe & {
  ingredients: string[];
  steps: Steps[];
};
