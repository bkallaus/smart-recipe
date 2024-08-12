type Instruction = {
  label: string;
  section?: string;
};

type IngestRecipe = {
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
