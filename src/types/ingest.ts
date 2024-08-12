export type Instruction = {
  label: string;
  section?: string;
};

export type IngestRecipe = {
  category: string;
  cuisine: string;
  keywords: string;
  name: string;
  description: string;
  heroImage: string;
  ingredients: string[];
  steps: Instruction[];
  url: string;
};
