"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Sparkles,
  Wand2,
  FileText,
  Database,
  ArrowLeft,
} from "lucide-react";
import { TargetShape } from "@/lib/types/target-shapes";
import { DataTable } from "../data-table";

export default function DataTablePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showDrawer, setShowDrawer] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [selectedShape, setSelectedShape] = useState<TargetShape | null>(null);

  const { data } = useAppSelector(state => state.table);
  const { shapes } = useAppSelector(state => state.targetShapes);

  const handleApplyTemplate = async (shape: TargetShape) => {
    setIsApplyingTemplate(true);
    setSelectedShape(shape);

    // Simulate template application
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsApplyingTemplate(false);
    setShowDrawer(false);
    // TODO: Apply the template to the data
  };

  const handleCreateFromData = () => {
    router.push("/playground/template-builder?source=data");
    setShowDrawer(false);
  };

  const handleCreateFromScratch = () => {
    router.push("/playground/template-builder?source=scratch");
    setShowDrawer(false);
  };

  // If no data, redirect back to playground
  if (data.length === 0) {
    router.push("/playground");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-none">
          <h1 className="text-2xl sm:text-3xl font-bold">Data Table</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View, edit, and transform your imported data
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
            </div>
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
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium truncate">
                                  {shape.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {shape.fields.length} fields
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleApplyTemplate(shape)}
                                disabled={isApplyingTemplate}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex-shrink-0 ml-2"
                              >
                                {isApplyingTemplate &&
                                selectedShape?.id === shape.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                  <Wand2 className="w-4 h-4 mr-2" />
                                )}
                                Apply
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
    </div>
  );
}
