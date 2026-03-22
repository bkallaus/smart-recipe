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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-[hsl(var(--surface))] min-h-screen py-12 px-6">
      <div className="m-3 max-w-4xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-[hsl(var(--outline-variant)/0.2)]">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[hsl(var(--on-surface))]">
            Edit Recipe
          </h1>
          <Button 
            type="submit" 
            loading={isSubmitting}
            className="rounded-full px-10 h-12 font-bold text-white gradient-primary shadow-ambient transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Details */}
          <div className="lg:col-span-12 space-y-10">
            <h2 className="text-2xl font-bold text-[hsl(var(--primary))] uppercase tracking-widest border-l-4 border-[hsl(var(--secondary))] pl-4">
              Core Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="md:col-span-2">
                <InputWithLabel
                  label="Recipe Name"
                  {...register("name")}
                  error={errors.name?.message}
                />
              </div>
              <div className="md:col-span-2">
                <InputWithLabel
                  label="Description / Story"
                  {...register("description")}
                  error={errors.description?.message}
                />
              </div>
              <div className="md:col-span-2">
                <InputWithLabel
                  label="Primary Image URL"
                  {...register("primary_image")}
                  error={errors.primary_image?.message}
                />
              </div>
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
              <InputWithLabel
                label="Keywords"
                {...register("keywords")}
                error={errors.keywords?.message}
              />
              <InputWithLabel
                label="Source URL"
                {...register("url")}
                error={errors.url?.message}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="lg:col-span-12 space-y-10">
            <h2 className="text-2xl font-bold text-[hsl(var(--primary))] uppercase tracking-widest border-l-4 border-[hsl(var(--secondary))] pl-4">
              Ingredients
            </h2>
            <Controller
              name="ingredients"
              control={control}
              render={({ field }) => {
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {field?.value.map((_, i) => (
                        <div key={`ingredient-${i}`} className="flex gap-2 items-end group">
                          <div className="flex-1">
                            <InputWithLabel
                              label={`Ingredient ${i + 1}`}
                              {...register(`ingredients.${i}`)}
                              error={errors.ingredients?.[i]?.message}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-[hsl(var(--on-surface-variant)/0.4)] hover:text-destructive transition-colors h-12"
                            onClick={() => {
                              const newList = [...field.value];
                              newList.splice(i, 1);
                              field.onChange(newList);
                            }}
                          >
                            <span className="text-xl">×</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    {errors.ingredients?.message && (
                      <p className="text-sm font-medium text-destructive">{errors.ingredients.message}</p>
                    )}
                    <Button
                      className="w-full h-14 rounded-xl border-2 border-dashed border-[hsl(var(--outline-variant)/0.3)] bg-transparent text-[hsl(var(--on-surface-variant))] hover:bg-[hsl(var(--surface-container-low))] hover:border-[hsl(var(--primary)/0.5)] transition-all font-bold uppercase tracking-widest"
                      type="button"
                      variant="outline"
                      onClick={() => field.onChange([...field.value, ""])}
                    >
                      + Add Ingredient
                    </Button>
                  </div>
                );
              }}
            />
          </div>

          {/* Steps */}
          <div className="lg:col-span-12 space-y-10">
            <h2 className="text-2xl font-bold text-[hsl(var(--primary))] uppercase tracking-widest border-l-4 border-[hsl(var(--secondary))] pl-4">
              Method
            </h2>
            <div className="space-y-12">
              {stepsFields.map((step, i) => (
                <div key={step.id} className="relative p-8 rounded-3xl bg-[hsl(var(--surface-container-low))] shadow-ambient-md space-y-6 border border-[hsl(var(--outline-variant)/0.1)]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--primary))] text-white font-bold">
                        {i + 1}
                      </span>
                      <h3 className="text-xl font-bold uppercase tracking-widest text-[hsl(var(--on-surface))]">Step {i + 1}</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[hsl(var(--on-surface-variant)/0.4)] hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => remove(i)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputWithLabel
                      label="Task Heading"
                      {...register(`steps.${i}.label`)}
                      error={errors.steps?.[i]?.label?.message}
                    />
                    <InputWithLabel
                      label="Section (e.g., 'For the Cake')"
                      {...register(`steps.${i}.section`)}
                      error={errors.steps?.[i]?.section?.message}
                    />
                    <div className="md:col-span-2">
                      <InputWithLabel
                        label="Instructions"
                        {...register(`steps.${i}.text`)}
                        error={errors.steps?.[i]?.text?.message}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.steps?.message && (
              <p className="text-sm font-medium text-destructive">{errors.steps.message}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 rounded-3xl border-2 border-dashed border-[hsl(var(--outline-variant)/0.3)] bg-transparent text-[hsl(var(--on-surface-variant))] hover:bg-[hsl(var(--surface-container-low))] hover:border-[hsl(var(--primary)/0.5)] transition-all font-bold uppercase tracking-widest"
              onClick={() =>
                append({
                  label: "",
                  text: "",
                  section: "",
                  sort: stepsFields.length,
                })
              }
            >
              + Add Method Step
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default RecipeForm;
