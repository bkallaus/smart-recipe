import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import 'server-only';

const genAI = new GoogleGenerativeAI(process.env.API_KEY as string);

const RecipeJsonSchema = {
  description: 'Recipe format',
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    cuisine: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    keywords: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    name: {
      type: SchemaType.STRING,
    },
    description: {
      type: SchemaType.STRING,
    },
    heroImage: {
      type: SchemaType.STRING,
    },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
    },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: {
            type: SchemaType.STRING,
          },
          text: {
            type: SchemaType.STRING,
          },
          section: {
            type: SchemaType.STRING,
          },
        },
        required: ['label'],
      },
    },
    url: {
      type: SchemaType.STRING,
    },
    prepTime: {
      type: SchemaType.STRING,
    },
    cookTime: {
      type: SchemaType.STRING,
    },
    totalTime: {
      type: SchemaType.STRING,
    },
    recipeYield: {
      type: SchemaType.STRING,
    },
  },
  required: [
    'category',
    'cuisine',
    'keywords',
    'name',
    'description',
    'heroImage',
    'ingredients',
    'steps',
    'url',
  ],
};

export const askAI = async (prompt: string) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RecipeJsonSchema,
    },
  });

  const result = await model.generateContent([prompt]);

  return result.response.text();
};
