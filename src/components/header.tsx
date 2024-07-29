import GoogleSignIn from "./google-sign-in";
import { getUser } from "@/server-actions/verify-credentials";

const Header = async () => {
  const user = await getUser();

  return (
    <div className="flex justify-between p-4">
      <span>Smart Recipe</span>
      <div>
        <GoogleSignIn userName={user?.name} />
      </div>
    </div>
  );
};

export default Header;
