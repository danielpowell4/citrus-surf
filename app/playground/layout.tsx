"use client";

import type React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { Home, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import StoreProvider from "@/lib/providers";
import { useLocalStorage } from "usehooks-ts";
import { useHydration } from "@/lib/hooks/useHydration";

function PlaygroundLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading playground...</p>
      </div>
    </div>
  );
}

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useLocalStorage(
    "playground-expanded",
    false,
    { initializeWithValue: false }
  );

  return (
    <StoreProvider>
      <PlaygroundContent isExpanded={isExpanded} setIsExpanded={setIsExpanded}>
        <Suspense fallback={<PlaygroundLoader />}>{children}</Suspense>
      </PlaygroundContent>
    </StoreProvider>
  );
}

function PlaygroundContent({
  children,
  isExpanded,
  setIsExpanded,
}: {
  children: React.ReactNode;
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}) {
  // Handle client-side hydration
  const { isHydrated } = useHydration();

  return (
    <div
      className={`container mx-auto py-10 px-4 transition-all duration-300 ease-in-out ${
        isExpanded ? "max-w-[1440px]" : "max-w-4xl"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">
              <span
                role="img"
                aria-label="Citrus Surf logo"
                className="inline-block"
              >
                🍋
              </span>{" "}
              Citrus Surf Importer
            </h1>
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Beta
            </Badge>
          </div>
          <blockquote className="text-base text-muted-foreground max-w-[600px] border-l-4 border-primary/30 pl-4 py-2 italic mt-2">
            "Stop writing one-off CSV cleaning scripts. Upload, map, clean,
            validate, and export structured data fast."
          </blockquote>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Compact
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Expand
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
