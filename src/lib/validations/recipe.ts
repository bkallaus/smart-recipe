import { z } from "zod";

export const stepSchema = z.object({
  label: z.string().min(1, "Label is required").max(1000),
  text: z.string().max(1000),
  section: z.string().max(500).optional(),
  sort: z.number(),
});

const minutesSchema = z
  .number("Enter a number of minutes")
  .int("Use whole minutes")
  .min(0)
  .max(100000)
  .nullable();

export const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100),
  description: z.string().max(500),
  primary_image: z.string().max(500),
  category: z.string().max(100),
  cuisine: z.string().max(100),
  keywords: z.string().max(500),
  url: z.string().url("Invalid URL").or(z.literal("")),
  prep_minutes: minutesSchema,
  cook_minutes: minutesSchema,
  total_minutes: minutesSchema,
  servings: z.string().max(100),
  author: z.string().max(200),
  ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

export type RecipeSchema = z.infer<typeof recipeSchema>;
