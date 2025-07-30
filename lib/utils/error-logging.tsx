/**
 * Enhanced error logging for development and debugging
 * Makes it easy to capture and share errors with Claude
 */

import { Component, ReactNode } from "react";

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

class ErrorLogger {
  private errors: ErrorLog[] = [];
  private maxErrors = 50; // Keep last 50 errors

  constructor() {
    if (typeof window !== "undefined") {
      this.setupGlobalErrorHandlers();
      this.makeGloballyAvailable();
    }
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener("error", event => {
      this.logError({
        type: "javascript",
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno,
      });
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", event => {
      this.logError({
        type: "promise",
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
      });
    });
  }

  private makeGloballyAvailable() {
    // Make available in browser console
    (window as any).errorLogger = {
      // Get all errors
      getAll: () => this.errors,

      // Get formatted output for Claude
      getForClaude: () => this.getFormattedForClaude(),

      // Copy formatted errors to clipboard
      copyForClaude: () => {
        const formatted = this.getFormattedForClaude();
        navigator.clipboard
          .writeText(formatted)
          .then(() => {
            console.log("✅ Errors copied to clipboard for Claude!");
          })
          .catch(() => {
            console.log("📋 Copy this for Claude:");
            console.log(formatted);
          });
      },

      // Clear errors
      clear: () => this.clear(),

      // Manually log an error
      log: (error: any, context?: any) => this.manualLog(error, context),

      // Get recent errors (last N)
      getRecent: (count = 5) => this.errors.slice(-count),
    };
  }

  logError(details: {
    type: "javascript" | "react" | "promise" | "manual";
    message: string;
    stack?: string;
    url: string;
    line?: number;
    column?: number;
    props?: any;
    componentStack?: string;
  }) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      type: details.type,
      message: details.message,
      stack: details.stack,
      url: details.url,
      userAgent: navigator.userAgent,
      props: details.props,
      componentStack: details.componentStack,
    };

    this.errors.push(errorLog);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Enhanced console output
    console.group(`🚨 ${details.type.toUpperCase()} ERROR`);
    console.error("Message:", details.message);
    if (details.stack) console.error("Stack:", details.stack);
    console.log("URL:", details.url);
    console.log("Timestamp:", errorLog.timestamp);
    if (details.line)
      console.log("Location:", `${details.line}:${details.column}`);
    if (details.props) console.log("Props:", details.props);
    if (details.componentStack)
      console.log("Component Stack:", details.componentStack);
    console.log("💡 Use errorLogger.copyForClaude() to copy for debugging");
    console.groupEnd();
  }

  // For React Error Boundaries
  logReactError(error: Error, errorInfo: { componentStack: string }) {
    this.logError({
      type: "react",
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      componentStack: errorInfo.componentStack,
    });
  }

  // Manual error logging
  manualLog(error: any, context?: any) {
    this.logError({
      type: "manual",
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      props: context,
    });
  }

  // Format errors for sharing with Claude
  private getFormattedForClaude(): string {
    if (this.errors.length === 0) {
      return "No errors logged yet.";
    }

    const recentErrors = this.errors.slice(-5); // Last 5 errors

    let output = `=== ERRORS FOR CLAUDE DEBUG ===\n`;
    output += `Total errors: ${this.errors.length}\n`;
    output += `Showing recent: ${recentErrors.length}\n`;
    output += `URL: ${window.location.href}\n`;
    output += `Timestamp: ${new Date().toISOString()}\n\n`;

    recentErrors.forEach((error, index) => {
      output += `--- ERROR ${index + 1} ---\n`;
      output += `Type: ${error.type}\n`;
      output += `Time: ${error.timestamp}\n`;
      output += `Message: ${error.message}\n`;

      if (error.stack) {
        output += `Stack: ${error.stack}\n`;
      }

      if (error.componentStack) {
        output += `Component Stack: ${error.componentStack}\n`;
      }

      if (error.props) {
        output += `Props: ${JSON.stringify(error.props, null, 2)}\n`;
      }

      output += "\n";
    });

    output += `=== END ERROR LOG ===`;

    return output;
  }

  clear() {
    this.errors = [];
    console.log("🧹 Error log cleared");
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// React Error Boundary component

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log to our error logger
    errorLogger.logReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 dark:text-red-400 text-sm mb-3">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                // Copy error details to clipboard
                (window as any).errorLogger?.copyForClaude();
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Copy Error for Debug
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
