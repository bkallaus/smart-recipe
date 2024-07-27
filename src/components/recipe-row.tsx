import type { Recipe } from '@/types/recipe';
import { titleCase } from 'title-case';

const RecipeRow = ({ recipes }: { recipes: Recipe[] }) => {
    return (
        <div className="grid md:grid-cols-3 gap-4 lg:gap-10">
            {recipes.map((recipe) => (
                <a key={`recipe-${recipe.id}`} href={`/recipe/${recipe.id}`}>
                    <div className="bg-white p-4 rounded-md shadow-md h-full">
                        {/* <img
            src={recipe.heroImage}
            alt={recipe.name}
            className="w-full h-48 object-cover rounded-md"
            /> */}
                        <h2 className="text-xl font-semibold mt-4 line-clamp-1">
                            {titleCase(recipe.name)}
                        </h2>
                        <p className="line-clamp-3">{recipe.description}</p>
                    </div>
                </a>
            ))}
        </div>
    );
};

export default RecipeRow;
