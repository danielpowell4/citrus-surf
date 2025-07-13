"use client";

import type React from "react";
import Link from "next/link";
import { Home, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import StoreProvider from "@/lib/providers";
import { useLocalStorage } from "usehooks-ts";

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
      <div
        className={`container mx-auto py-10 px-4 transition-all duration-300 ease-in-out ${
          isExpanded ? "max-w-[1600px]" : "max-w-4xl"
        }`}
        style={{
          maxWidth: isExpanded ? "min(1600px, 100vw - 2rem)" : undefined,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">Citrus Surf Importer</h1>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Beta
              </Badge>
            </div>
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
    </StoreProvider>
  );
}
