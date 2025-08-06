"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bot,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  Target,
  StopCircle,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface ErrorLog {
  timestamp: string;
  type: "javascript" | "react" | "promise" | "manual";
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  props?: any;
  componentStack?: string;
}

// Helper function to safely get className as string
const getClassNameString = (element: Element): string => {
  if (!element.className) return "";
  return typeof element.className === "string"
    ? element.className
    : element.className.toString();
};

// Helper function to safely stringify objects with circular references
const safeStringify = (obj: any, maxDepth: number = 2): string => {
  const seen = new WeakSet();
  const stringify = (value: any, depth: number): any => {
    if (depth > maxDepth) return "[Max Depth Reached]";
    if (value === null) return null;
    if (typeof value !== "object") return value;
    if (seen.has(value)) return "[Circular Reference]";

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map(item => stringify(item, depth + 1));
    }

    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip function properties and some common problematic props
      if (
        typeof val === "function" ||
        key.startsWith("_") ||
        key === "children"
      ) {
        result[key] = "[Function/Complex]";
      } else {
        result[key] = stringify(val, depth + 1);
      }
    }
    return result;
  };

  try {
    return JSON.stringify(stringify(obj, 0), null, 2);
  } catch (error) {
    return `[Stringify Error: ${error}]`;
  }
};

export function DevClaudeHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  // Only show in development
  const isDev = process.env.NODE_ENV === "development";

  // Update overlay position and size
  const updateOverlay = useCallback((element: HTMLElement) => {
    if (!overlayRef.current) return;

    const rect = element.getBoundingClientRect();
    const overlay = overlayRef.current;

    // Use viewport coordinates directly since overlay is fixed positioned
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.display = "block";
  }, []);

  // Get element hierarchy for better context
  const getElementHierarchy = useCallback((element: HTMLElement): string[] => {
    const hierarchy: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += `#${current.id}`;
      const classNames = getClassNameString(current);
      if (classNames) {
        selector += `.${classNames.split(" ").join(".")}`;
      }
      hierarchy.unshift(selector);
      current = current.parentElement;
    }

    return hierarchy;
  }, []);

  // Try to extract React component info
  const extractReactInfo = useCallback((element: HTMLElement) => {
    try {
      // Look for React Fiber node
      const fiberKey = Object.keys(element).find(
        key =>
          key.startsWith("__reactFiber") ||
          key.startsWith("__reactInternalInstance")
      );

      if (fiberKey) {
        const fiber = (element as any)[fiberKey];
        return {
          componentName:
            fiber?.type?.name || fiber?.elementType?.name || "Unknown",
          props: fiber?.memoizedProps || fiber?.pendingProps,
          state: fiber?.memoizedState,
        };
      }
    } catch {
      // React info extraction failed, continue without it
    }

    return null;
  }, []);

  // Format element context for Claude
  const formatElementContextForClaude = useCallback((context: any): string => {
    let output = `=== SELECTED ELEMENT CONTEXT FOR CLAUDE ===\n`;
    output += `URL: ${window.location.href}\n`;
    output += `Timestamp: ${new Date().toISOString()}\n\n`;

    output += `--- ELEMENT INFO ---\n`;
    output += `Tag: <${context.element.tagName}>\n`;
    if (context.element.id) output += `ID: ${context.element.id}\n`;
    const classNames = getClassNameString(context.element);
    if (classNames) {
      output += `Classes: ${classNames}\n`;
    }
    if (context.element.textContent)
      output += `Text: ${context.element.textContent}\n`;

    output += `\n--- ATTRIBUTES ---\n`;
    Object.entries(context.element.attributes).forEach(([key, value]) => {
      output += `${key}: ${value}\n`;
    });

    output += `\n--- POSITION & SIZE ---\n`;
    const rect = context.position.rect;
    output += `Position: ${rect.left}, ${rect.top}\n`;
    output += `Size: ${rect.width}x${rect.height}\n`;

    output += `\n--- HIERARCHY ---\n`;
    output += context.hierarchy.join(" > ") + "\n";

    if (context.reactInfo) {
      output += `\n--- REACT COMPONENT ---\n`;
      output += `Component: ${context.reactInfo.componentName}\n`;
      if (context.reactInfo.props) {
        output += `Props: ${safeStringify(context.reactInfo.props)}\n`;
      }
    }

    output += `\n--- KEY STYLES ---\n`;
    const styles = context.styles.computed;
    const importantStyles = [
      "display",
      "position",
      "width",
      "height",
      "margin",
      "padding",
      "border",
      "background",
      "color",
      "font-size",
      "z-index",
    ];
    importantStyles.forEach(prop => {
      const value = styles.getPropertyValue(prop);
      if (
        value &&
        value !== "auto" &&
        value !== "none" &&
        value !== "initial"
      ) {
        output += `${prop}: ${value}\n`;
      }
    });

    output += `\n=== END ELEMENT CONTEXT ===`;

    return output;
  }, []);

  // Extract detailed context from selected element
  const extractElementContext = useCallback(
    (element: HTMLElement) => {
      const context = {
        element: {
          tagName: element.tagName.toLowerCase(),
          className: element.className,
          id: element.id,
          textContent: element.textContent?.slice(0, 100),
          attributes: Array.from(element.attributes).reduce(
            (acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            },
            {} as Record<string, string>
          ),
        },
        position: {
          rect: element.getBoundingClientRect(),
          scrollPosition: { x: window.scrollX, y: window.scrollY },
        },
        styles: {
          computed: window.getComputedStyle(element),
          inline: element.style.cssText,
        },
        hierarchy: getElementHierarchy(element),
        reactInfo: extractReactInfo(element),
      };

      // Store context globally for Claude access
      const globalLogger = (window as any).errorLogger;
      if (globalLogger) {
        globalLogger.selectedElementContext = context;
        globalLogger.copyElementForClaude = () => {
          const formatted = formatElementContextForClaude(context);
          navigator.clipboard.writeText(formatted).catch(() => {
            console.log("📋 Copy this element context for Claude:");
            console.log(formatted);
          });
        };
      }

      // Immediately copy to clipboard when element is selected
      const formatted = formatElementContextForClaude(context);

      // Try clipboard API first, fallback to console if it fails
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(formatted)
          .then(() => {
            // Show visual feedback
            const notification = document.createElement("div");
            notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 10000;
          background: #10b981; color: white; padding: 12px 16px;
          border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: system-ui; font-size: 14px;
        `;
            notification.textContent = "✅ Element copied to clipboard!";
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
          })
          .catch(_error => {
            console.log("📋 Copy this element context for Claude:");
            console.log(formatted);
            // Show error notification
            const notification = document.createElement("div");
            notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 10000;
          background: #ef4444; color: white; padding: 12px 16px;
          border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: system-ui; font-size: 14px;
        `;
            notification.textContent =
              "❌ Clipboard failed - check console for data";
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          });
      } else {
        console.log("📋 Copy this element context for Claude:");
        console.log(formatted);
        // Show warning notification
        const notification = document.createElement("div");
        notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #f59e0b; color: white; padding: 12px 16px;
        border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: system-ui; font-size: 14px;
      `;
        notification.textContent = "⚠️ Check console for element data";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
      }
    },
    [getElementHierarchy, extractReactInfo, formatElementContextForClaude]
  );

  // Element selection handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelectMode) return;

      const target = e.target as HTMLElement;
      if (target && !target.closest("[data-claude-helper]")) {
        setHoveredElement(target);
        updateOverlay(target);
      }
    },
    [isSelectMode, updateOverlay]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isSelectMode) return;

      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (target && !target.closest("[data-claude-helper]")) {
        setSelectedElement(target);
        extractElementContext(target);
        setIsSelectMode(false);
      }
    },
    [isSelectMode, extractElementContext]
  );

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectMode) {
        setIsSelectMode(false);
        setHoveredElement(null);
      }
    },
    [isSelectMode]
  );

  useEffect(() => {
    if (!isDev || typeof window === "undefined") return;

    // Poll for errors from the global error logger
    const updateErrors = () => {
      const globalLogger = (window as any).errorLogger;
      if (globalLogger) {
        const allErrors = globalLogger.getAll();
        setErrors(allErrors);
        setErrorCount(allErrors.length);
      }
    };

    // Initial check
    updateErrors();

    // Check for new errors every 2 seconds
    const interval = setInterval(updateErrors, 2000);

    return () => clearInterval(interval);
  }, [isDev]);

  // Element selection mode event listeners
  useEffect(() => {
    if (!isDev) return;

    if (isSelectMode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.cursor = "crosshair";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.cursor = "";
      if (overlayRef.current) {
        overlayRef.current.style.display = "none";
      }
      setHoveredElement(null);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.cursor = "";
    };
  }, [isDev, isSelectMode, handleMouseMove, handleClick, handleKeyPress]);

  if (!isDev) return null;

  const copyForClaude = () => {
    // Copy errors to clipboard
    const globalLogger = (window as any).errorLogger;
    if (globalLogger) {
      globalLogger.copyForClaude();
      // Show success feedback
      const button = document.querySelector(
        "[data-copy-button]"
      ) as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }
  };

  const _copyElementForClaude = () => {
    const globalLogger = (window as any).errorLogger;
    if (globalLogger && globalLogger.copyElementForClaude && selectedElement) {
      globalLogger.copyElementForClaude();
      // Show success feedback
      const button = document.querySelector(
        "[data-copy-element-button]"
      ) as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }
  };

  const toggleSelectMode = () => {
    const newMode = !isSelectMode;
    setIsSelectMode(newMode);
    setSelectedElement(null);
  };

  const clearErrors = () => {
    const globalLogger = (window as any).errorLogger;
    if (globalLogger) {
      globalLogger.clear();
      setErrors([]);
      setErrorCount(0);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getErrorBadgeColor = (type: string) => {
    switch (type) {
      case "react":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      case "javascript":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
      case "promise":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      default:
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 ${isSelectMode ? "z-[9994]" : "z-[9999]"}`}
        data-claude-helper
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
          size="sm"
        >
          <Bot className="w-4 h-4 mr-2" />
          Claude Helper
          {errorCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-white text-red-600 text-xs min-w-[20px] h-5 flex items-center justify-center p-0">
              {errorCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Claude Helper Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-16 left-1/2 transform -translate-x-1/2 w-96 max-w-[90vw] ${isSelectMode ? "z-[9995]" : "z-[9998]"}`}
          data-claude-helper
        >
          <Card className="shadow-2xl border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Claude Helper
                  {errorCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    >
                      {errorCount} errors
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0"
                  >
                    {isMinimized ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="pt-0">
                {/* Action Buttons */}
                <div className="space-y-2 mb-3">
                  {/* Element Selection - Primary Action */}
                  <Button
                    onClick={toggleSelectMode}
                    size="sm"
                    variant={isSelectMode ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isSelectMode ? (
                      <>
                        <StopCircle className="w-3 h-3 mr-1" />
                        Exit Select Mode
                      </>
                    ) : (
                      <>
                        <Target className="w-3 h-3 mr-1" />
                        Select Element
                      </>
                    )}
                  </Button>

                  {/* Error Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={copyForClaude}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      data-copy-button
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Copy Errors
                    </Button>
                    <Button onClick={clearErrors} variant="outline" size="sm">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Error List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {errors.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No errors logged yet
                    </div>
                  ) : (
                    errors
                      .slice(-5)
                      .reverse()
                      .map((error, index) => (
                        <div
                          key={`${error.timestamp}-${index}`}
                          className="p-2 border border-border dark:border-border rounded text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              className={`text-xs ${getErrorBadgeColor(error.type)}`}
                            >
                              {error.type}
                            </Badge>
                            <span className="text-muted-foreground">
                              {formatTime(error.timestamp)}
                            </span>
                          </div>
                          <div className="font-medium text-foreground text-xs break-words">
                            {error.message.length > 100
                              ? `${error.message.substring(0, 100)}...`
                              : error.message}
                          </div>
                          {error.componentStack && (
                            <div className="text-muted-foreground text-xs">
                              Component:{" "}
                              {error.componentStack.split("\n")[1]?.trim() ||
                                "Unknown"}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>

                {errors.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground mt-2">
                    Showing 5 most recent of {errors.length} total errors
                  </div>
                )}

                {/* Selected Element Info */}
                {selectedElement && (
                  <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Element Selected
                      </span>
                    </div>
                    <div className="text-green-700 dark:text-green-300 font-mono">
                      {selectedElement.tagName.toLowerCase()}
                      {selectedElement.id && `#${selectedElement.id}`}
                      {getClassNameString(selectedElement) &&
                        `.${getClassNameString(selectedElement).split(" ")[0]}`}
                    </div>
                    <div className="text-green-600 dark:text-green-400 text-xs mt-1">
                      ✅ Copied to clipboard automatically - includes page URL
                      and full context
                    </div>
                  </div>
                )}

                {/* Select Mode Instructions */}
                {isSelectMode && (
                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded text-xs text-orange-800 dark:text-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointer2 className="w-3 h-3" />
                      <span className="font-medium">
                        Element Selection Mode Active
                      </span>
                    </div>
                    <div>
                      Hover over elements and click to select • Press Escape to
                      exit
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Selection Mode Indicator */}
      {isSelectMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">
              Element Selection Mode - Click any element
            </span>
          </div>
        </div>
      )}

      {/* Element Selection Overlay */}
      {isSelectMode && (
        <div
          ref={overlayRef}
          className="fixed pointer-events-none z-[9997] border-2 border-blue-500 bg-blue-500/30 shadow-lg"
          style={{ display: "none", transition: "all 0.1s ease" }}
        >
          <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded shadow-md whitespace-nowrap font-mono">
            {hoveredElement && (
              <>
                {hoveredElement.tagName.toLowerCase()}
                {hoveredElement.id && `#${hoveredElement.id}`}
                {getClassNameString(hoveredElement) &&
                  `.${getClassNameString(hoveredElement).split(" ")[0]}`}
              </>
            )}
          </div>
          <div className="absolute -bottom-6 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded shadow-md">
            Click to select
          </div>
        </div>
      )}
    </>
  );
}
