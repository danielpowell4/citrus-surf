"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bug, 
  Copy, 
  X, 
  Trash2, 
  Eye, 
  ChevronUp, 
  ChevronDown,
  AlertCircle 
} from 'lucide-react';

interface ErrorLog {
  timestamp: string;
  type: 'javascript' | 'react' | 'promise' | 'manual';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  props?: any;
  componentStack?: string;
}

export function DevErrorLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDev || typeof window === 'undefined') return;

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

  if (!isDev) return null;

  const copyForClaude = () => {
    const globalLogger = (window as any).errorLogger;
    if (globalLogger) {
      globalLogger.copyForClaude();
      // Show success feedback
      const button = document.querySelector('[data-copy-button]') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }
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
      case 'react': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'javascript': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'promise': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
          size="sm"
        >
          <Bug className="w-4 h-4 mr-2" />
          Error Logger
          {errorCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 bg-white text-red-600 text-xs min-w-[20px] h-5 flex items-center justify-center p-0"
            >
              {errorCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Error Panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-[9998] w-96 max-w-[90vw]">
          <Card className="shadow-2xl border-2 border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Dev Error Logger
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
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
                    {isMinimized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
                <div className="flex gap-2 mb-3">
                  <Button
                    onClick={copyForClaude}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    data-copy-button
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy for Claude
                  </Button>
                  <Button
                    onClick={clearErrors}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>

                {/* Error List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {errors.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No errors logged yet
                    </div>
                  ) : (
                    errors.slice(-5).reverse().map((error, index) => (
                      <div
                        key={`${error.timestamp}-${index}`}
                        className="p-2 border border-border dark:border-border rounded text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={`text-xs ${getErrorBadgeColor(error.type)}`}>
                            {error.type}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatTime(error.timestamp)}
                          </span>
                        </div>
                        <div className="font-medium text-foreground text-xs break-words">
                          {error.message.length > 100 
                            ? `${error.message.substring(0, 100)}...`
                            : error.message
                          }
                        </div>
                        {error.componentStack && (
                          <div className="text-muted-foreground text-xs">
                            Component: {error.componentStack.split('\n')[1]?.trim() || 'Unknown'}
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

                {/* Usage Hint */}
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-800 dark:text-blue-200">
                  💡 Click "Copy for Claude" to get formatted error details for debugging
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}