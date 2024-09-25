"use client";
import { InputWithLabel } from "@/components/input-with-label";
import { Button } from "@/components/ui/button";
import { editRecipe } from "@/server-actions/recipes";
import type { FullRecipe } from "@/types/recipe";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useForm } from "react-hook-form";

const RecipeForm = ({ recipe }: { recipe: FullRecipe }) => {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FullRecipe>({
    defaultValues: recipe,
  });

  const onSubmit = async (data: FullRecipe) => {
    await editRecipe(data, recipe.id);
    router.push(`/recipe/${recipe.uuid}`);
  };

  // const { fields: stepsFields } = useFieldArray({
  //   control, // control props comes from useForm (optional: if you are using FormProvider)
  //   name: "steps", // unique name for your Field Array
  // });
  // const { fields: ingredientFields } = useFieldArray({
  //   control, // control props comes from useForm (optional: if you are using FormProvider)
  //   name: "ingredients", // unique name for your Field Array
  // });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputWithLabel
        label="Name"
        {...register("name", {
          required: true,
          maxLength: 100,
        })}
      />
      <InputWithLabel
        label="Description"
        {...register("description", {
          maxLength: 500,
        })}
      />
      <InputWithLabel
        label="Primary Image"
        {...register("primary_image", {
          maxLength: 500,
        })}
      />
      <InputWithLabel
        label="Category"
        {...register("category", {
          maxLength: 100,
        })}
      />
      <InputWithLabel
        label="Cuisine"
        {...register("cuisine", {
          maxLength: 100,
        })}
      />
      <InputWithLabel
        label="Keywords"
        {...register("keywords", {
          maxLength: 500,
        })}
      />
      <InputWithLabel
        label="URL"
        {...register("url", {
          maxLength: 500,
        })}
      />
      {/* {stepsFields.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          <InputWithLabel
            label={"Label"}
            {...register(`steps.${i}.label`, {
              required: true,
              maxLength: 100,
            })}
          />
          <InputWithLabel
            label={"Text"}
            {...register(`steps.${i}.text`, {
              required: true,
              maxLength: 100,
            })}
          />
          <InputWithLabel
            label={"section"}
            {...register(`steps.${i}.section`, {
              required: true,
              maxLength: 100,
            })}
          />
        </div>
      ))}
      <div>Ingredients</div>
      {ingredientFields.map((ingredient, i) => (
        <div key={ingredient.id}>
          <InputWithLabel {...register(`ingredients.${i}.value`)} />
        </div>
      ))} */}
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default RecipeForm;
