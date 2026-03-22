"use client";
import { InputWithLabel } from "@/components/input-with-label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { recipeSchema, type RecipeSchema } from "@/lib/validations/recipe";
import { editRecipe } from "@/server-actions/recipes";
import type { FullRecipe } from "@/types/recipe";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

const RecipeForm = ({ recipe }: { recipe: FullRecipe }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeSchema>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: recipe.name,
      description: recipe.description,
      primary_image: recipe.primary_image,
      category: recipe.category,
      cuisine: recipe.cuisine,
      keywords: recipe.keywords,
      url: recipe.url,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    },
  });

  const onSubmit = async (data: RecipeSchema) => {
    setIsSubmitting(true);
    try {
      await editRecipe({ ...recipe, ...data }, recipe.id);
      toast({
        title: "Success",
        description: "Recipe updated successfully",
      });
      router.push(`/recipe/${recipe.uuid}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    fields: stepsFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "steps",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="m-3 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Recipe</h1>
          <Button type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
        <div className="space-y-4">
          <InputWithLabel
            label="Name"
            {...register("name")}
            error={errors.name?.message}
          />
          <InputWithLabel
            label="Description"
            {...register("description")}
            error={errors.description?.message}
          />
          <InputWithLabel
            label="Primary Image URL"
            {...register("primary_image")}
            error={errors.primary_image?.message}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWithLabel
              label="Category"
              {...register("category")}
              error={errors.category?.message}
            />
            <InputWithLabel
              label="Cuisine"
              {...register("cuisine")}
              error={errors.cuisine?.message}
            />
          </div>
          <InputWithLabel
            label="Keywords (comma separated)"
            {...register("keywords")}
            error={errors.keywords?.message}
          />
          <InputWithLabel
            label="Source URL"
            {...register("url")}
            error={errors.url?.message}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
          <Controller
            name="ingredients"
            control={control}
            render={({ field }) => {
              return (
                <div className="space-y-2">
                  {field?.value.map((_, i) => (
                    <div key={`ingredient-${i}`} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <InputWithLabel
                          {...register(`ingredients.${i}`)}
                          error={errors.ingredients?.[i]?.message}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-1"
                        onClick={() => {
                          const newList = [...field.value];
                          newList.splice(i, 1);
                          field.onChange(newList);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {errors.ingredients?.message && (
                    <p className="text-xs text-destructive">{errors.ingredients.message}</p>
                  )}
                  <Button
                    className="w-full mt-2"
                    type="button"
                    variant="outline"
                    onClick={() => field.onChange([...field.value, ""])}
                  >
                    Add Ingredient
                  </Button>
                </div>
              );
            }}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Steps</h2>
          <div className="space-y-6">
            {stepsFields.map((step, i) => (
              <div key={step.id} className="p-4 border rounded-lg bg-card space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Step {i + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => remove(i)}
                  >
                    Remove
                  </Button>
                </div>
                <InputWithLabel
                  label="Label"
                  {...register(`steps.${i}.label`)}
                  error={errors.steps?.[i]?.label?.message}
                />
                <InputWithLabel
                  label="Details"
                  {...register(`steps.${i}.text`)}
                  error={errors.steps?.[i]?.text?.message}
                />
                <InputWithLabel
                  label="Section (optional)"
                  {...register(`steps.${i}.section`)}
                  error={errors.steps?.[i]?.section?.message}
                />
              </div>
            ))}
          </div>
          {errors.steps?.message && (
            <p className="text-xs text-destructive mt-2">{errors.steps.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={() =>
              append({
                label: "",
                text: "",
                section: "",
                sort: stepsFields.length,
              })
            }
          >
            Add Step
          </Button>
        </div>
      </div>
    </form>
  );
};

export default RecipeForm;
