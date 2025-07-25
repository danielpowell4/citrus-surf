"use client";

import { usePersistence } from "@/lib/hooks/usePersistence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Save, Download, AlertCircle } from "lucide-react";

export function PersistenceStatus() {
  const {
    isInitialized,
    hasPersistedState,
    wasStateLoaded,
    wasRecentlySaved,
    lastSavedAt,
    lastLoadedAt,
    error,
    clearPersistedState,
    getFormattedTimestamps,
  } = usePersistence();

  const timestamps = getFormattedTimestamps();

  if (!isInitialized) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Persistence Status
        </CardTitle>
        <CardDescription>
          Redux state persistence with debounced writes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasPersistedState ? "default" : "secondary"}>
            {hasPersistedState ? "Has Saved State" : "No Saved State"}
          </Badge>
          {wasStateLoaded && (
            <Badge variant="outline" className="text-green-600">
              <Download className="h-3 w-3 mr-1" />
              Loaded
            </Badge>
          )}
          {wasRecentlySaved && (
            <Badge variant="outline" className="text-blue-600">
              <Save className="h-3 w-3 mr-1" />
              Saved
            </Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Saved:</span>
            <span className="font-mono">{timestamps.lastSaved}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Loaded:</span>
            <span className="font-mono">{timestamps.lastLoaded}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearPersistedState}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear State
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground">
          State is automatically saved with 1-second debouncing to prevent
          excessive writes.
        </div>
      </CardContent>
    </Card>
  );
}
