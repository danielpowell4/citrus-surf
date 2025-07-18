"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { TargetShapeWorkflow } from "../target-shape-workflow";
import { TargetShape } from "@/lib/types/target-shapes";
import { selectTargetShape } from "@/lib/features/targetShapesSlice";

function TemplateBuilderContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { data } = useAppSelector(state => state.table);

  const source = searchParams.get("source");

  const handleShapeCreated = (shape: TargetShape) => {
    // Select the newly created shape
    dispatch(selectTargetShape(shape.id));
    // Navigate to data table with shape applied
    router.push("/playground/data-table");
  };

  const handleCancel = () => {
    // Navigate back to the data table (or playground if no data)
    if (data.length > 0) {
      router.push("/playground/data-table");
    } else {
      router.push("/playground");
    }
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
