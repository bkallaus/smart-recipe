import { getFullRecipeById } from "@/server-actions/recipes";
import { notFound } from "next/navigation";
import RecipeForm from "./recipe-form";

const EditRecipePage = async ({
  params: { uuid },
}: {
  params: { uuid: string };
}) => {
  const recipe = await getFullRecipeById(uuid);

  if (!recipe) {
    notFound();
  }

  return (
    <div>
      <RecipeForm recipe={recipe} />
    </div>
  );
};

export default EditRecipePage;
