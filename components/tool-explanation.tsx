import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ToolExplanationProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolExplanation({
  title,
  description,
  children,
}: ToolExplanationProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        {children}
      </CardContent>
    </Card>
  );
}
