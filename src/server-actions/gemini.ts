import OpenAI from 'openai';
import 'server-only';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY as string,
});

const recipeSchema = {
  type: 'object',
  properties: {
    category: { type: 'string' },
    cuisine: { type: 'string' },
    keywords: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    heroImage: { type: 'string' },
    ingredients: {
      type: 'array',
      items: { type: 'string' },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          text: { type: 'string' },
          section: { type: 'string' },
        },
        required: ['label'],
        additionalProperties: false,
      },
    },
    url: { type: 'string' },
  },
  required: ['category', 'cuisine', 'keywords', 'name', 'description', 'heroImage', 'ingredients', 'steps', 'url'],
  additionalProperties: false,
};

export const askAI = async (prompt: string) => {
  const response = await client.chat.completions.create({
    model: 'google/gemma-3n-e4b-it:free',
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'recipe',
        strict: true,
        schema: recipeSchema,
      },
    },
    // Only route to providers that support structured outputs
    // @ts-expect-error — OpenRouter-specific extension
    provider: {
      require_parameters: true,
    },
    messages: [
      { role: 'user', content: prompt },
    ],
  });

  return response.choices[0].message.content ?? '';
};
