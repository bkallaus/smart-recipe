import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Serif } from "next/font/google";

import { Analytics } from "@vercel/analytics/react";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-noto-serif",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-manrope",
});

const APP_NAME = "Smart Recipe";
const APP_DEFAULT_TITLE = "Smart Recipe";
const APP_TITLE_TEMPLATE = "%s - Smart Recipe";
const APP_DESCRIPTION = "Recipe app for organizing your recipes";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  icons: [
    {
      url: "/icons/android-icon-192x192.png",
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
  themeColor: "#fff8f3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${notoSerif.variable} ${manrope.variable}`}>
      <body className="bg-[hsl(var(--surface))] text-[hsl(var(--on-surface))]">
        <Header />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
