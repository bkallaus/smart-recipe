import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import { hasAccess } from "@/server-actions/verify-credentials";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Recipes",
  description: "Smart Recipe ingests and organizes your recipes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!(await hasAccess())) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <div className="m-auto text-xl font-bold text-center">
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
