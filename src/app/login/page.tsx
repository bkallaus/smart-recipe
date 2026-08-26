import { redirect } from "next/navigation";
import GoogleSignIn from "@/components/google-sign-in";
import { hasAccess } from "@/server-actions/verify-credentials";

// Only allow relative, single-slash paths so a crafted `redirect` param
// can't bounce the user to another origin after signing in.
const safeRedirect = (value: string | string[] | undefined) => {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }

  return value;
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) => {
  const { redirect: redirectParam } = await searchParams;
  const destination = safeRedirect(redirectParam);

  if (await hasAccess()) {
    redirect(destination);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--surface))] px-6 py-16">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-[hsl(var(--surface-container-lowest))] p-10 shadow-ambient">
        <div className="space-y-3 text-center">
          <h1
            className="text-3xl font-semibold text-[hsl(var(--on-surface))]"
            style={{ fontFamily: "'Noto Serif', Georgia, serif" }}
          >
            Sign in to continue
          </h1>
          <p className="text-[hsl(var(--on-surface-variant))] text-sm leading-relaxed">
            Recipes, favorites, and importing are available once you sign in
            with your Google account.
          </p>
        </div>

        <div className="flex justify-center">
          <GoogleSignIn userName={undefined} />
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
