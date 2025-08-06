"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  loadShapes,
  selectTargetShape,
} from "@/lib/features/targetShapesSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, FileText } from "lucide-react";

interface TargetShapeSelectorProps {
  onCreateNew?: () => void; // Callback to open shape creation workflow
  onCreateFromData?: () => void; // Callback to create shape from current data
  hasData?: boolean; // Whether there's data available to create shape from
}

export function TargetShapeSelector({
  onCreateNew,
  onCreateFromData,
  hasData = false,
}: TargetShapeSelectorProps) {
  const dispatch = useAppDispatch();
  const { shapes, selectedShapeId, error } = useAppSelector(
    state => state.targetShapes
  );

  // Load shapes on component mount
  useEffect(() => {
    dispatch(loadShapes());
  }, [dispatch]);

  const selectedShape = selectedShapeId
    ? shapes.find(shape => shape.id === selectedShapeId)
    : null;

  const handleSelectShape = (shapeId: string) => {
    dispatch(selectTargetShape(shapeId));
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      console.log("Create new shape - no callback provided");
    }
  };

  const handleClearSelection = () => {
    dispatch(selectTargetShape(null));
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
              <Badge variant="secondary">Saved</Badge>
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
            {shapes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Your Saved Shapes
                </h4>
                <div className="space-y-1">
                  {shapes.map((shape: any) => (
                    <Button
                      key={shape.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSelectShape(shape.id)}
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

            {/* Create New */}
            <div className="space-y-2">
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Shape
              </Button>

              {/* Create from Current Data */}
              {hasData && onCreateFromData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onCreateFromData}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create from Current Data
                </Button>
              )}
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
