"use client";

import { useEffect } from 'react';
import { errorLogger, ErrorBoundary } from '@/lib/utils/error-logging';
import { DevClaudeHelper } from './dev-claude-helper';

export function ClaudeHelperProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Claude helper (includes error logging)
    // Show console message about availability
    console.log('🤖 Claude Helper initialized! Available commands:');
    console.log('  • errorLogger.getAll() - View all errors');
    console.log('  • errorLogger.copyForClaude() - Copy formatted errors for Claude');
    console.log('  • errorLogger.copyElementForClaude() - Copy selected element context');
    console.log('  • errorLogger.getRecent(5) - Get last 5 errors');
    console.log('  • errorLogger.clear() - Clear error log');
    console.log('  • errorLogger.log(error, context) - Manually log an error');
  }, []);

  return (
    <ErrorBoundary>
      {children}
      <DevClaudeHelper />
    </ErrorBoundary>
  );
}