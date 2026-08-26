import { getFullRecipeById } from "@/server-actions/recipes";
import { requireAccess } from "@/helpers/require-access";
import { notFound } from "next/navigation";
import RecipeForm from "./recipe-form";

const EditRecipePage = async ({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) => {
  const { uuid } = await params;

  await requireAccess(`/recipe/${uuid}/edit`);

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
