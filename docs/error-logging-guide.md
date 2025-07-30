# Error Logging Guide

## Overview

The app now includes a comprehensive error logging system that automatically captures JavaScript errors, React errors, and unhandled promise rejections, making it easy to share debugging information with Claude.

## How to Use

### 1. Automatic Error Capture

All errors are automatically captured and logged. When an error occurs, you'll see enhanced console output with debugging information.

### 2. Browser Console Commands

Open DevTools (`F12`) and use these commands:

#### **Copy Errors for Claude (Most Useful)**

```javascript
errorLogger.copyForClaude();
```

This copies formatted error information to your clipboard that you can paste directly in your conversation with Claude.

#### **View All Errors**

```javascript
errorLogger.getAll();
```

Returns array of all captured errors.

#### **View Recent Errors**

```javascript
errorLogger.getRecent(5); // Last 5 errors
```

#### **Clear Error Log**

```javascript
errorLogger.clear();
```

#### **Manually Log an Error**

```javascript
errorLogger.log(new Error("Test error"), { context: "additional info" });
```

### 3. Error Information Captured

For each error, the system captures:

- **Timestamp**: When the error occurred
- **Type**: javascript, react, promise, or manual
- **Message**: Error message
- **Stack trace**: Full stack trace
- **URL**: Current page URL
- **Component stack**: For React errors
- **Props/Context**: Additional debugging info

### 4. Example Usage

When you encounter an error:

1. Open DevTools (`F12`)
2. Go to Console tab
3. Type: `errorLogger.copyForClaude()`
4. Paste the copied text in your Claude conversation

## Error Output Format

The formatted output includes:

```
=== ERRORS FOR CLAUDE DEBUG ===
Total errors: 3
Showing recent: 3
URL: http://localhost:3000/playground/data-table
Timestamp: 2024-01-15T10:30:00.000Z

--- ERROR 1 ---
Type: react
Time: 2024-01-15T10:29:55.123Z
Message: Maximum update depth exceeded
Stack: Error: Maximum update depth exceeded
    at getRootForUpdatedFiber...
Component Stack:
    in ColumnMapping
    in DataTablePage

=== END ERROR LOG ===
```

## React Error Boundary

The app also includes an Error Boundary that:

- Catches React component errors
- Logs them automatically
- Shows a user-friendly error message
- Includes a "Copy Error for Debug" button

## Integration with Existing Code

### Manual Error Logging

```typescript
try {
  // Risky operation
  someFunction();
} catch (error) {
  errorLogger.manualLog(error, {
    operation: "someFunction",
    userId: user.id,
    additionalContext: "any relevant info",
  });
  throw error; // Re-throw if needed
}
```

### Toast Integration

```typescript
// In error handlers, you can both show user message and log for debugging
catch (error) {
  errorLogger.manualLog(error, { operation: 'data-import' });
  toast({
    title: "Import failed",
    description: "Please try again",
    variant: "destructive",
  });
}
```

## Benefits

1. **No Copy-Paste**: Just run `errorLogger.copyForClaude()`
2. **Rich Context**: Includes stack traces, component stacks, and metadata
3. **Automatic Capture**: No need to manually catch every error
4. **Development Focus**: Only runs in development, won't affect production
5. **Easy Sharing**: Formatted specifically for debugging conversations

## Console Tips

- The error logger announces itself in the console on page load
- All available commands are listed in the initial console message
- Errors are automatically formatted with clear sections
- Use `console.clear()` to clean up console output when needed

This system makes debugging much more efficient - you can quickly capture and share comprehensive error information without manual copying and formatting!
