"use client";

import { useEffect } from 'react';
import { errorLogger, ErrorBoundary } from '@/lib/utils/error-logging';
import { DevErrorLogger } from './dev-error-logger';

export function ErrorLoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize error logger (already happens in constructor)
    // Show console message about availability
    console.log('🔧 Error Logger initialized! Available commands:');
    console.log('  • errorLogger.getAll() - View all errors');
    console.log('  • errorLogger.copyForClaude() - Copy formatted errors for Claude');
    console.log('  • errorLogger.getRecent(5) - Get last 5 errors');
    console.log('  • errorLogger.clear() - Clear error log');
    console.log('  • errorLogger.log(error, context) - Manually log an error');
  }, []);

  return (
    <ErrorBoundary>
      {children}
      <DevErrorLogger />
    </ErrorBoundary>
  );
}