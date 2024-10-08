import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import { hasAccess } from "@/server-actions/verify-credentials";
import type { Metadata, Viewport } from "next";
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
  if (!(await hasAccess())) {
    return (
      <html lang="en">
        <head />
        <body className={inter.className}>
          <Header />
          <h1 className="text-4xl font-semibold text-center">
            Welcome to Smart Recipes
          </h1>
          <div className="m-auto text-xl font-bold text-center mt-4">
            Please Login to Access Site
          </div>
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
