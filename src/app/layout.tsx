import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import { hasAccess } from "@/server-actions/verify-credentials";
import type { Metadata, Viewport } from "next";

import { getRecentRecipes } from "@/server-actions/recipes";
import RecipeRow from "@/components/recipe-row";

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "Smart Recipe";
const APP_DEFAULT_TITLE = "Smart Recipe";
const APP_TITLE_TEMPLATE = "%s - Smart Recipe";
const APP_DESCRIPTION = "Recipe app for organizing your recipes";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  icons: [
    {
      url: "./android-icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
  ],
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const recentRecipes = await getRecentRecipes(3);

  if (!(await hasAccess())) {
    return (
      <html lang="en">
        <head />
        <body className={inter.className}>
          <Header />
          <div className="m-auto border border-rose-400 bg-rose-100 text-lg text-center mt-4">
            To view recipes and ingest new ones please login
          </div>
          <main className="flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="container px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                        Import Any Recipe with AI
                      </h1>
                      <p className="max-w-[600px] text-gray-500 md:text-xl">
                        Instantly import and organize recipes from anywhere with
                        our AI-powered platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recipe Examples Section */}
            <section className="w-full py-12 md:py-16 lg:py-20">
              <div className="container px-4 md:px-6">
                <div className="mx-auto max-w-[800px] space-y-4 text-center">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    Recent Recipes
                  </h2>
                  <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl">
                    Discover recipes imported and enhanced by our AI technology.
                  </p>
                </div>
                <div className="pt-8 md:pt-12">
                  <RecipeRow recipes={recentRecipes} />
                </div>
              </div>
            </section>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
