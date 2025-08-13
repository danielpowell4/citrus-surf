/**
 * Error Boundary specifically for Lookup Components
 * Provides graceful degradation when lookup operations fail
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?:
    | "lookup-cell"
    | "reference-data"
    | "fuzzy-match"
    | "template-builder";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class LookupErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error for debugging
    console.error("Lookup Error Boundary caught an error:", {
      error,
      errorInfo,
      context: this.props.context,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error logging system
    if (typeof window !== "undefined" && (window as any).errorLogger) {
      (window as any).errorLogger.logError({
        type: "react",
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        context: this.props.context,
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  getContextualErrorMessage(): {
    title: string;
    description: string;
    actions: ReactNode;
  } {
    const { context } = this.props;
    const { retryCount } = this.state;

    switch (context) {
      case "lookup-cell":
        return {
          title: "Lookup Field Error",
          description:
            "There was an error processing the lookup field. You can continue using other fields normally.",
          actions: (
            <>
              {retryCount < this.maxRetries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Lookup
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={this.handleReset}>
                Reset Field
              </Button>
            </>
          ),
        };

      case "reference-data":
        return {
          title: "Reference Data Error",
          description:
            "Unable to load or process reference data. Check your reference files and try again.",
          actions: (
            <>
              {retryCount < this.maxRetries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Loading
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  (window.location.href = "/playground/reference-data")
                }
              >
                <Home className="h-4 w-4 mr-1" />
                Manage Reference Data
              </Button>
            </>
          ),
        };

      case "fuzzy-match":
        return {
          title: "Fuzzy Match Review Error",
          description:
            "There was an error during fuzzy match processing. Your data has been preserved.",
          actions: (
            <>
              {retryCount < this.maxRetries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Review
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  (window.location.href = "/playground/data-table")
                }
              >
                <Home className="h-4 w-4 mr-1" />
                Return to Data Table
              </Button>
            </>
          ),
        };

      case "template-builder":
        return {
          title: "Template Builder Error",
          description:
            "There was an error in the template builder. Your progress has been saved.",
          actions: (
            <>
              {retryCount < this.maxRetries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  (window.location.href = "/playground/template-builder")
                }
              >
                <Home className="h-4 w-4 mr-1" />
                Start Fresh
              </Button>
            </>
          ),
        };

      default:
        return {
          title: "Lookup System Error",
          description:
            "An unexpected error occurred in the lookup system. The rest of the application should continue working normally.",
          actions: (
            <>
              {retryCount < this.maxRetries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="mr-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={this.handleReset}>
                Reset Component
              </Button>
            </>
          ),
        };
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const { title, description, actions } = this.getContextualErrorMessage();

      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mb-4">
                {description}
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2 mt-4">{actions}</div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  Developer Info
                </summary>
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mt-1">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-1">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Convenience wrapper components for common lookup contexts
 */
export const LookupCellErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <LookupErrorBoundary context="lookup-cell">{children}</LookupErrorBoundary>
);

export const ReferenceDataErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <LookupErrorBoundary context="reference-data">{children}</LookupErrorBoundary>
);

export const FuzzyMatchErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <LookupErrorBoundary context="fuzzy-match">{children}</LookupErrorBoundary>
);

export const TemplateBuilderErrorBoundary: React.FC<{
  children: ReactNode;
}> = ({ children }) => (
  <LookupErrorBoundary context="template-builder">
    {children}
  </LookupErrorBoundary>
);
