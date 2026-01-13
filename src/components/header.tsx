import GoogleSignIn from "./google-sign-in";
import { getUser } from "@/server-actions/verify-credentials";
import RecipeIngest from "./recipe-ingest";

const Header = async () => {
  const user = await getUser();

  return (
    <div className="flex flex-wrap items-center justify-between p-4 gap-4">
      <a href="/" className="font-bold text-xl">
        Smart Recipe
      </a>
      {user?.name && (
        <div className="order-last w-full md:w-auto md:order-none">
          <RecipeIngest />
        </div>
      )}
      <div>
        <GoogleSignIn userName={user?.name} />
      </div>
    </div>
  );
};

export default Header;
