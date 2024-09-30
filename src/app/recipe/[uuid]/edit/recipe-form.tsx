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
        <div className="grid grid-cols-4 gap-3 ">
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
        </div>
        <div className="h-3" />
        <h2 className="text-center">Ingredients</h2>
        <div className="grid grid-cols-3 gap-3">
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
                  <Button
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
        <h2 className="text-center">Steps</h2>
        <div>
          {stepsFields.map((step, i) => (
            <div key={step.id} className="flex gap-3 items-end mb-1">
              <InputWithLabel
                label={!i ? "Label" : ""}
                {...register(`steps.${i}.label`, {
                  required: true,
                  maxLength: 1000,
                })}
              />
              <InputWithLabel
                label={!i ? "Text" : ""}
                {...register(`steps.${i}.text`, {
                  maxLength: 1000,
                })}
              />
              <InputWithLabel
                label={!i ? "Section" : ""}
                {...register(`steps.${i}.section`, {
                  maxLength: 500,
                })}
              />
              <Button type="button" onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
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
