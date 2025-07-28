import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Footer } from "@/components/footer";
import { ClaudeHelperProvider } from "@/components/claude-helper-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Tools Portal",
  description:
    "Simple, powerful tools to help you work with your data more efficiently.",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClaudeHelperProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            themes={["light", "dark", "system"]}
            disableTransitionOnChange={false}
          >
            <div className="min-h-screen flex flex-col">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </ClaudeHelperProvider>
      </body>
    </html>
  );
}
