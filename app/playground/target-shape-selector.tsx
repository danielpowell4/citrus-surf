"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  loadSavedShapes,
  loadTemplates,
  selectSavedShape,
  selectTemplate,
  clearSelection,
} from "@/lib/features/targetShapesSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, FolderOpen, FileText } from "lucide-react";

export function TargetShapeSelector() {
  const dispatch = useAppDispatch();
  const { savedShapes, templates, selectedShape, selectionType, error } =
    useAppSelector(state => state.targetShapes);

  // Load shapes and templates on component mount
  useEffect(() => {
    dispatch(loadSavedShapes());
    dispatch(loadTemplates());
  }, [dispatch]);

  const handleSelectSavedShape = (shapeId: string) => {
    dispatch(selectSavedShape(shapeId));
  };

  const handleSelectTemplate = (templateId: string) => {
    dispatch(selectTemplate(templateId));
  };

  const handleCreateNew = () => {
    // TODO: Open shape builder modal
    console.log("Create new shape");
  };

  const handleClearSelection = () => {
    dispatch(clearSelection());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Target Shape
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how you want your clean data to look
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection Display */}
        {selectedShape && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedShape.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedShape.fields.length} fields
                </p>
              </div>
              <Badge variant="secondary">
                {selectionType === "saved" && "Saved"}
                {selectionType === "template" && "Template"}
                {selectionType === "new" && "New"}
              </Badge>
            </div>
            {selectedShape.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedShape.description}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="mt-2"
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Selection Options */}
        {!selectedShape && (
          <div className="space-y-3">
            {/* Saved Shapes */}
            {savedShapes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Your Saved Shapes
                </h4>
                <div className="space-y-1">
                  {savedShapes.map(shape => (
                    <Button
                      key={shape.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSelectSavedShape(shape.id)}
                    >
                      {shape.name}
                      <Badge variant="secondary" className="ml-auto">
                        {shape.fields.length} fields
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Templates */}
            {templates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Templates</h4>
                <div className="space-y-1">
                  {templates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      {template.name}
                      <Badge variant="outline" className="ml-auto">
                        Template
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New */}
            <div>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Shape
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
