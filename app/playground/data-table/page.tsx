"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Wand2,
  FileText,
  ArrowLeft,
  Target,
  ArrowRight,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { TargetShape } from "@/lib/types/target-shapes";
import { DataTable } from "../data-table";
import { ColumnMapping } from "@/components/column-mapping";
import { applyTemplate } from "@/lib/features/tableSlice";
import { loadShapes } from "@/lib/features/targetShapesSlice";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { targetShapesStorage } from "@/lib/utils/target-shapes-storage";
import { createLookupNavigator, parseFuzzyMatchReviewParams, generateLookupBreadcrumbs } from "@/lib/utils/lookup-navigation";

export default function DataTablePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const navigator = createLookupNavigator(router, "/playground/data-table", searchParams);
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedShape, setSelectedShape] = useState<TargetShape | null>(null);
  const [mappingMode, setMappingMode] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  
  // Parse fuzzy match review parameters
  const fuzzyMatchParams = parseFuzzyMatchReviewParams(searchParams);
  const isFuzzyMatchReview = fuzzyMatchParams.review === 'fuzzy-matches';
  const fuzzyMatchBatchId = fuzzyMatchParams.batch;

  // Template management state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<TargetShape | null>(
    null
  );

  const { data } = useAppSelector(state => state.table);
  const { shapes } = useAppSelector(state => state.targetShapes);

  // Memoize importColumns to prevent unnecessary re-renders
  const importColumns = useMemo(() => {
    return data.length > 0
      ? Object.keys(data[0]).filter(key => !key.startsWith("_"))
      : [];
  }, [data]);

  // Load target shapes on component mount and handle data check
  useEffect(() => {
    dispatch(loadShapes());

    // Check for data after a short delay to allow hydration
    const timer = setTimeout(() => {
      if (data.length === 0) {
        router.push("/playground");
      } else {
        setIsLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [dispatch, data.length, router]);

  // Check URL parameters for target shape mapping mode
  useEffect(() => {
    const targetShapeId = searchParams.get("targetShape");
    const mode = searchParams.get("mode");

    if (targetShapeId && mode === "mapping") {
      const shape = shapes.find(s => s.id === targetShapeId);
      if (shape) {
        setSelectedShape(shape);
        setMappingMode(true);
      }
    }
  }, [searchParams, shapes]);

  const handleApplyTemplate = async (shape: TargetShape) => {
    setIsApplyingTemplate(true);
    setSelectedShape(shape);

    // Enter mapping mode with the selected shape
    setMappingMode(true);
    setShowDrawer(false);
    setIsApplyingTemplate(false);

    // Update URL to reflect mapping mode
    router.push(`/playground/data-table?targetShape=${shape.id}&mode=mapping`);
  };

  const handleExitMappingMode = useCallback(() => {
    setMappingMode(false);
    setSelectedShape(null);
    setColumnMapping({});
    router.push("/playground/data-table");
  }, [router]);

  const handleMappingChange = useCallback((mapping: Record<string, string>) => {
    setColumnMapping(mapping);
  }, []);

  const handleApplyMapping = () => {
    if (!selectedShape || Object.keys(columnMapping).length === 0) {
      toast({
        title: "No mapping to apply",
        description: "Please configure column mappings first",
        variant: "destructive",
      });
      return;
    }

    console.log("Applying mapping:", columnMapping);
    console.log(
      "Selected shape fields:",
      selectedShape.fields.map(f => ({ id: f.id, name: f.name }))
    );

    // Create field mappings (targetFieldId -> targetFieldName)
    const fieldMappings = selectedShape.fields.reduce(
      (acc, field) => {
        acc[field.id] = field.name;
        return acc;
      },
      {} as Record<string, string>
    );

    // Let Redux handle the data transformation using current state data
    dispatch(
      applyTemplate({
        targetShapeId: selectedShape.id,
        targetShapeName: selectedShape.name,
        columnMapping,
        fieldMappings,
        targetFields: selectedShape.fields.map(f => ({
          id: f.id,
          name: f.name,
        })),
      })
    );

    // Exit mapping mode
    setMappingMode(false);
    setSelectedShape(null);
    setColumnMapping({});
    router.push("/playground/data-table");

    toast({
      title: "Mapping applied successfully",
      description: `Data transformed according to "${selectedShape.name}" target shape`,
    });
  };

  const handleCreateFromData = () => {
    router.push("/playground/template-builder?source=data");
    setShowDrawer(false);
  };

  const handleCreateFromScratch = () => {
    router.push("/playground/template-builder?source=scratch");
    setShowDrawer(false);
  };

  // Template management functions
  const handleEditTemplate = (shape: TargetShape) => {
    router.push(`/playground/template-builder?edit=${shape.id}`);
    setShowDrawer(false);
  };

  const handleDeleteTemplate = (shape: TargetShape) => {
    setTemplateToDelete(shape);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;

    const success = targetShapesStorage.delete(templateToDelete.id);

    if (success) {
      dispatch(loadShapes()); // Refresh the shapes list
      toast({
        title: "Template deleted",
        description: `"${templateToDelete.name}" has been deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }

    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  // Show loading state during hydration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto py-6">
        <div className="max-w-none">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Data Table
            {mappingMode && selectedShape && (
              <Badge variant="secondary" className="ml-3">
                <Target className="w-4 h-4 mr-1" />
                Mapping to {selectedShape.name}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {mappingMode
              ? "Map your data columns to the target shape fields"
              : "View, edit, and transform your imported data"}
          </p>
        </div>

        <div className="space-y-6 max-w-none">
          <div className="w-full">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/playground")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Import
              </Button>

              {mappingMode && selectedShape && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExitMappingMode}
                    className="flex items-center gap-2"
                  >
                    Exit Mapping Mode
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyMapping}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Apply Mapping
                  </Button>
                </div>
              )}
            </div>
            {mappingMode && selectedShape && (
              <ColumnMapping
                importColumns={importColumns}
                targetShape={selectedShape}
                onMappingChange={handleMappingChange}
                onApplyMapping={handleApplyMapping}
                className="mb-4"
              />
            )}

            <DataTable
              data={data}
              currentVersion={1}
              onOpenTemplates={() => setShowDrawer(true)}
            />
          </div>
        </div>
      </div>

      {/* Templates Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-96 bg-background border-l shadow-xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Templates & Shapes</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDrawer(false)}
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Saved Templates */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Saved Templates
                  </h3>
                  {shapes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No saved templates yet. Create your first one below.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {shapes.map(shape => (
                        <Card
                          key={shape.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Template Info - Full Width */}
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1 pr-2">
                                  <h4 className="font-medium leading-tight">
                                    {shape.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {shape.fields.length} fields
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 flex-shrink-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleEditTemplate(shape)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteTemplate(shape)
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Apply Button - Full Width */}
                              <Button
                                size="sm"
                                onClick={() => handleApplyTemplate(shape)}
                                disabled={isApplyingTemplate}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                              >
                                {isApplyingTemplate &&
                                selectedShape?.id === shape.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                  <Wand2 className="w-4 h-4 mr-2" />
                                )}
                                Apply Template
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Create New */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Template
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={handleCreateFromData}
                      disabled={data.length === 0}
                    >
                      <div className="text-left">
                        <div className="font-medium">From Current Data</div>
                        <div className="text-sm text-muted-foreground">
                          Analyze and create template from imported data
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={handleCreateFromScratch}
                    >
                      <div className="text-left">
                        <div className="font-medium">From Scratch</div>
                        <div className="text-sm text-muted-foreground">
                          Build a custom template manually
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
