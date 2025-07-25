# Testing Setup

This project uses [Vitest](https://vitest.dev/) for unit testing with React Testing Library for component testing.

## Setup

The testing setup includes:

- **Vitest**: Fast unit test runner
- **jsdom**: DOM environment for testing React components
- **React Testing Library**: Utilities for testing React components
- **@testing-library/jest-dom**: Custom matchers for DOM testing

## Configuration

- `vitest.config.ts`: Main Vitest configuration
- `test/setup.ts`: Global test setup with mocks and matchers

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run specific test file
pnpm test lib/utils/data-analysis.test.ts
```

## Test Structure

### Unit Tests

- `lib/utils/data-analysis.test.ts`: Tests for field type detection logic
- `lib/features/tableSlice.test.ts`: Tests for Redux store functionality

### Test Patterns

#### Testing Utility Functions

```typescript
import { describe, it, expect } from "vitest";
import { analyzeDataForTargetShape } from "./data-analysis";

describe("Data Analysis", () => {
  it("should detect field types correctly", () => {
    const testData = [{ firstName: "John", lastName: "Doe", age: 30 }];

    const result = analyzeDataForTargetShape(testData);
    const firstNameField = result.suggestedFields.find(
      f => f.name === "firstname"
    );

    expect(firstNameField?.type).toBe("string");
  });
});
```

#### Testing Redux Slices

```typescript
import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import tableReducer, { setData } from "./tableSlice";

describe("Table Slice", () => {
  const createTestStore = () => {
    return configureStore({
      reducer: { table: tableReducer },
    });
  };

  it("should handle setData action", () => {
    const store = createTestStore();
    const testData = [{ id: "1", name: "John" }];

    store.dispatch(setData(testData));
    expect(store.getState().table.data).toEqual(testData);
  });
});
```

## Mocks

The test setup includes mocks for:

- **Next.js Router**: `useRouter`, `useSearchParams`, `usePathname`
- **Redux Hooks**: `useAppDispatch`, `useAppSelector`

## Best Practices

1. **Test the behavior, not implementation**: Focus on what the code does, not how it does it
2. **Use descriptive test names**: Make it clear what each test is verifying
3. **Keep tests simple**: One assertion per test when possible
4. **Use setup functions**: Create helper functions for common test setup
5. **Mock external dependencies**: Don't test third-party libraries

## Example: Testing Field Type Detection

The field type detection tests verify that:

- `firstName` and `lastName` are detected as `string` (not `enum`)
- `status` fields with limited values are detected as `enum`
- `email` fields are detected as `email`
- Numeric fields are detected correctly
- Boolean fields are detected correctly
- Date fields are detected correctly

This ensures the data analysis logic works correctly for the CSV importer functionality.
