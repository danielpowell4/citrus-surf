"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { TargetShapeWorkflow } from "../target-shape-workflow";
import { TargetShape } from "@/lib/types/target-shapes";

function TemplateBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data } = useAppSelector(state => state.table);

  const source = searchParams.get("source");

  const handleShapeCreated = (shape: TargetShape) => {
    // Navigate back to the main playground
    router.push("/playground");
    // TODO: Optionally select the newly created shape
  };

  const handleCancel = () => {
    // Navigate back to the main playground
    router.push("/playground");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Create Target Shape
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {source === "data"
              ? "Define the structure for your clean data output based on imported data"
              : "Define the structure for your clean data output"}
          </p>
        </div>

        <TargetShapeWorkflow
          importedData={source === "data" ? data : []}
          onShapeCreated={handleShapeCreated}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

export default function TemplateBuilderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TemplateBuilderContent />
    </Suspense>
  );
}
