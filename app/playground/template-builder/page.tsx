"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { TargetShapeWorkflow } from "../target-shape-workflow";
import { TargetShape } from "@/lib/types/target-shapes";
import { selectTargetShape, loadShapes } from "@/lib/features/targetShapesSlice";
import { createLookupNavigator, parseLookupConfigParams, generateLookupBreadcrumbs } from "@/lib/utils/lookup-navigation";

function TemplateBuilderContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { data } = useAppSelector(state => state.table);
  const { shapes } = useAppSelector(state => state.targetShapes);
  
  const _navigator = createLookupNavigator(router, "/playground/template-builder", searchParams);

  const source = searchParams.get("source");
  const editId = searchParams.get("edit");
  
  // Parse lookup configuration parameters
  const lookupParams = parseLookupConfigParams(searchParams);
  const isLookupConfiguration = lookupParams.action === 'configure-lookup';

  // Find the shape to edit if in edit mode
  const shapeToEdit = editId
    ? shapes.find(shape => shape.id === editId)
    : undefined;
    
  // Generate breadcrumbs
  const breadcrumbs = generateLookupBreadcrumbs("/playground/template-builder", searchParams);

  const handleShapeCreated = (shape: TargetShape) => {
    // Select the newly created shape
    dispatch(selectTargetShape(shape.id));
    
    // Reload shapes to ensure the newly created shape is available in the store
    // This ensures the shape will be found when the data table page loads
    dispatch(loadShapes());
    
    // If there's data available, go to mapping mode; otherwise just go to data table
    if (data.length > 0) {
      // Navigate to data table in mapping mode with the newly created shape
      router.push(`/playground/data-table?targetShape=${shape.id}&mode=mapping`);
    } else {
      // Navigate to data table without mapping mode (no data to map)
      router.push("/playground/data-table");
    }
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
      <div className="mx-auto py-6">
        {/* Breadcrumbs */}
        {isLookupConfiguration && (
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {breadcrumb.current ? (
                  <span className="font-medium text-foreground">{breadcrumb.label}</span>
                ) : (
                  <button
                    onClick={() => router.push(breadcrumb.href)}
                    className="hover:text-foreground transition-colors"
                  >
                    {breadcrumb.label}
                  </button>
                )}
              </div>
            ))}
          </nav>
        )}
        
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isLookupConfiguration
              ? "Configure Lookup Field"
              : editId
                ? "Edit Target Shape"
                : "Create Target Shape"}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isLookupConfiguration
              ? `Configure lookup field settings and reference data connections for field "${lookupParams.field}"`
              : editId
                ? `Edit the structure and fields of "${shapeToEdit?.name || "target shape"}"`
                : source === "data"
                  ? "Define the structure for your clean data output based on imported data"
                  : "Define the structure for your clean data output"}
          </p>
        </div>

        <TargetShapeWorkflow
          importedData={source === "data" ? data : []}
          initialShape={shapeToEdit}
          onShapeCreated={handleShapeCreated}
          onCancel={handleCancel}
          isLookupConfiguration={isLookupConfiguration}
          lookupFieldId={lookupParams.field}
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
