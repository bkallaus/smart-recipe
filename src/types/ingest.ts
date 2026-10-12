export type Instruction = {
  label: string;
  text?: string;
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
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
  servings?: string;
  author?: string;
};

export type IngestSource =
  | 'json-ld'
  | 'microdata'
  | 'ai-json-ld'
  | 'ai-page'
  | 'text';
