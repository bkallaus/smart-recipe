"use client";
import { InputWithLabel } from "@/components/input-with-label";
import { Button } from "@/components/ui/button";
import { editRecipe } from "@/server-actions/recipes";
import type { FullRecipe } from "@/types/recipe";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";

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
      <div className="m-3">
        <div className="flex justify-between">
          <h1>Edit Recipe</h1>
          <Button type="submit">Submit</Button>
        </div>
        <div className="">
          <InputWithLabel
            label="Name"
            {...register("name", {
              required: true,
              maxLength: 100,
            })}
          />
          <div className="h-3" />
          <InputWithLabel
            label="Description"
            {...register("description", {
              maxLength: 500,
            })}
          />
          <div className="h-3" />
          <InputWithLabel
            label="Primary Image"
            {...register("primary_image", {
              maxLength: 500,
            })}
          />
          <div className="h-3" />
          <InputWithLabel
            label="Category"
            {...register("category", {
              maxLength: 100,
            })}
          />
          <div className="h-3" />
          <InputWithLabel
            label="Cuisine"
            {...register("cuisine", {
              maxLength: 100,
            })}
          />
          <div className="h-3" />
          <InputWithLabel
            label="Keywords"
            {...register("keywords", {
              maxLength: 500,
            })}
          />
          <div className="h-3" />
          <InputWithLabel
            label="URL"
            {...register("url", {
              maxLength: 500,
            })}
          />
        </div>
        <div className="h-3" />
        <h2>Ingredients</h2>
        <div className="">
          <Controller
            name="ingredients"
            control={control}
            render={({ field }) => {
              return (
                <>
                  {field?.value.map((ingredient, i) => (
                    <div key={`ingredient-${i}`} className="flex gap-1 mb-1">
                      <InputWithLabel {...register(`ingredients.${i}`)} />
                      <Button
                        type="button"
                        onClick={() =>
                          field.onChange(
                            field.value.filter((item) => item !== ingredient)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div className="h-3" />
                  <Button
                    className="m-auto"
                    type="button"
                    onClick={() => field.onChange([...field.value, ""])}
                  >
                    Add Ingredient
                  </Button>
                </>
              );
            }}
          />
        </div>
        <div className="h-3" />
        <h2>Steps</h2>
        <div>
          {stepsFields.map((step, i) => (
            <div key={step.id} className="w-200">
              <div className="h-6" />
              <InputWithLabel
                label={"Label"}
                {...register(`steps.${i}.label`, {
                  required: true,
                  maxLength: 1000,
                })}
              />
              <div className="h-3" />
              <InputWithLabel
                label={"Text"}
                {...register(`steps.${i}.text`, {
                  maxLength: 1000,
                })}
              />
              <div className="h-3" />
              <InputWithLabel
                label={"Section"}
                {...register(`steps.${i}.section`, {
                  maxLength: 500,
                })}
              />
              <div className="h-3" />
              <Button type="button" onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="h-3" />
        <Button
          type="button"
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
    </form>
  );
};

export default RecipeForm;
