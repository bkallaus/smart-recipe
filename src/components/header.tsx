import GoogleSignIn from "./google-sign-in";
import { getUser } from "@/server-actions/verify-credentials";
import RecipeIngest from "./recipe-ingest";
import { Dices } from "lucide-react";
import Link from "next/link";

const Header = async () => {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-[hsl(var(--outline-variant)/0.15)]">
      <div className="flex flex-wrap items-center justify-between px-6 py-4 gap-4 max-w-7xl mx-auto">
        <a
          href="/"
          className="font-serif text-2xl font-semibold tracking-tight text-[hsl(var(--on-surface))] hover:text-[hsl(var(--primary))] transition-colors duration-200"
          style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
        >
          Smart Recipe
        </a>
        {user?.name && (
          <div className="order-last w-full md:w-auto md:order-none">
            <RecipeIngest />
          </div>
        )}
        <div className="flex items-center gap-4">
          {user?.name && (
            <Link
              href="/random"
              className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--on-surface-variant))] hover:text-[hsl(var(--primary))] transition-colors duration-200"
              title="Pick a random recipe"
            >
              <Dices className="h-5 w-5" />
              <span className="hidden sm:inline">Surprise me</span>
            </Link>
          )}
          <GoogleSignIn userName={user?.name} />
        </div>
      </div>
    </header>
  );
};

export default Header;
