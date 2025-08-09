"use client";

import { useCallback, useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  History,
  RotateCcw,
  FileText,
  User,
  Settings,
  X,
  Undo2,
  Redo2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  selectHistory,
  selectCurrentIndex,
  setCurrentIndex,
} from "@/lib/features/historySlice";
import {
  restoreStateToAction,
  getActionSummary,
} from "@/lib/utils/time-travel";

interface CompactHistoryProps {
  className?: string;
}

/**
 * Compact History Component
 *
 * Provides a streamlined history interface with:
 * - "History" label with undo/redo controls
 * - Expandable drawer with full history view
 * - Version numbers and timestamps
 * - Reapply functionality for any version
 *
 * To add new action types:
 * 1. Add action to meaningfulActions in lib/store.ts
 * 2. Add summary in lib/utils/time-travel.ts
 * 3. Add icon and color functions below
 * 4. See docs/history-system.md for complete guide
 */
export function CompactHistory({ className }: CompactHistoryProps) {
  const dispatch = useAppDispatch();
  const history = useAppSelector(selectHistory);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const [isExpanded, setIsExpanded] = useState(false);

  const _lastAction = history[history.length - 1];

  // Undo/Redo functionality
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const targetIndex = currentIndex - 1;
      const targetAction = history[targetIndex];
      if (targetAction) {
        restoreStateToAction(dispatch, targetAction);
        dispatch(setCurrentIndex(targetIndex));
      }
    }
  }, [canUndo, currentIndex, dispatch, history]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const targetIndex = currentIndex + 1;
      const targetAction = history[targetIndex];
      if (targetAction) {
        restoreStateToAction(dispatch, targetAction);
        dispatch(setCurrentIndex(targetIndex));
      }
    }
  }, [canRedo, currentIndex, dispatch, history]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close drawer
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
        return;
      }

      // Undo/Redo shortcuts (only when not in an input field)
      if (
        !e.target ||
        !(e.target as HTMLElement).closest("input, textarea, [contenteditable]")
      ) {
        if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    if (isExpanded) {
      // Prevent body scroll when drawer is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isExpanded, canUndo, canRedo, handleUndo, handleRedo]);

  const handleReapplyState = (actionIndex: number) => {
    const targetAction = history[actionIndex];
    if (targetAction) {
      // Restore the state to this action
      restoreStateToAction(dispatch, targetAction);

      // Create a new action that references the restored action
      const newAction = {
        ...targetAction,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9),
        payload: {
          ...targetAction.payload,
          restoredFrom: actionIndex,
          restoredFromAction: targetAction.type,
        },
        type: "table/restoreFromHistory",
      };

      // This will be automatically captured by the middleware
      dispatch({
        type: "table/restoreFromHistory",
        payload: newAction.payload,
      });
    }
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes("setData") || actionType.includes("importJsonData"))
      return <FileText className="w-4 h-4" />;
    if (actionType.includes("updateCell"))
      return <FileText className="w-4 h-4" />;
    if (actionType.includes("Sort") || actionType.includes("toggleColumnSort"))
      return <Settings className="w-4 h-4" />;
    if (actionType.includes("Filter")) return <User className="w-4 h-4" />;
    if (actionType.includes("Visibility"))
      return <Settings className="w-4 h-4" />;
    if (actionType.includes("Pagination"))
      return <Settings className="w-4 h-4" />;
    if (actionType.includes("restoreFromHistory"))
      return <RotateCcw className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes("restoreFromHistory"))
      return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300";
    if (actionType.includes("setData") || actionType.includes("importJsonData"))
      return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
    if (actionType.includes("updateCell"))
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300";
    if (actionType.includes("Sort"))
      return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300";
    if (actionType.includes("Filter"))
      return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300";
    if (actionType.includes("Visibility"))
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  };

  const formatActionDescription = (action: any, _index: number) => {
    if (action.type === "table/restoreFromHistory") {
      const restoredFrom = action.payload?.restoredFrom;
      if (restoredFrom !== undefined) {
        return `Created by re-applying version ${restoredFrom + 1}`;
      }
    }
    return getActionSummary(action);
  };

  return (
    <div className={className}>
      {/* Last Edited Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">History</span>

        {/* Undo/Redo Controls */}
        {history.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-6 w-6 p-0"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-6 w-6 p-0"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant={history.length > 0 ? "outline" : "ghost"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>

      {/* History Drawer Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsExpanded(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-96 bg-background shadow-2xl border-l border-border transform transition-all duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Version History</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {history.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No actions recorded yet
                      </div>
                    ) : (
                      [...history].reverse().map((action, _index) => {
                        const originalIndex = history.length - 1 - _index;
                        return (
                          <div
                            key={action.id}
                            className="p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {/* Action Icon */}
                              <div className="flex-shrink-0">
                                <div
                                  className={`p-2 rounded-md ${getActionColor(action.type)}`}
                                >
                                  {getActionIcon(action.type)}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {formatActionDescription(
                                    action,
                                    originalIndex
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  v{originalIndex + 1}:{" "}
                                  {formatDistanceToNow(action.timestamp, {
                                    addSuffix: true,
                                  })}
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleReapplyState(originalIndex)
                                }
                                className="text-xs"
                              >
                                Reapply
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
