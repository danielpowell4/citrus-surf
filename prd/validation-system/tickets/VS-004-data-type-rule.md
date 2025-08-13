# VS-004: Data Type Validation Rule

## Context

Implement data type validation that ensures values match the expected field types (string, number, integer, date, currency, etc.) defined in the target shape, with intelligent type conversion suggestions.

## Acceptance Criteria

### AC1: DataTypeRule Implementation

- [ ] Create `DataTypeRule` class extending `BaseValidationRule`
- [ ] Rule ID: 'data-type'
- [ ] Rule type: 'type'
- [ ] Severity: 'error' for type mismatches
- [ ] Support all TargetField types: string, number, integer, date, currency, boolean, email, phone, url

### AC2: Type Validation Logic

- [ ] String validation: accept any non-null value, convert to string
- [ ] Number validation: check for valid numeric values, allow decimals
- [ ] Integer validation: check for whole numbers only
- [ ] Date validation: validate date strings and Date objects
- [ ] Boolean validation: accept true/false, "true"/"false", "yes"/"no", 1/0
- [ ] Email validation: check email format pattern
- [ ] Phone validation: check phone number patterns
- [ ] URL validation: check valid URL format
- [ ] Currency validation: check numeric values with optional currency symbols

### AC3: Type Conversion Support

- [ ] Attempt automatic type conversion before flagging errors
- [ ] String to number: "123" → 123
- [ ] String to date: "2023-12-25" → Date object
- [ ] String to boolean: "true" → true, "yes" → true
- [ ] Number to string: 123 → "123"
- [ ] Log conversion attempts in validation metadata

### AC4: Error Messages and Fixes

- [ ] Generate specific error messages: "Expected {expectedType}, got {actualType}"
- [ ] Include current value and expected format in error message
- [ ] Suggest type conversion when possible: "Convert '123' to number?"
- [ ] Suggest format corrections: "Use format YYYY-MM-DD for dates"

## Technical Requirements

- Use robust type checking (not just `typeof`)
- Handle edge cases: NaN, Infinity, invalid dates
- Support multiple date formats and locales
- Configurable validation strictness levels

## Testing Requirements

- [ ] Test string type validation (pass/fail cases)
- [ ] Test number type validation including edge cases (NaN, Infinity)
- [ ] Test integer validation (reject decimals)
- [ ] Test date validation with multiple formats
- [ ] Test boolean validation with various input formats
- [ ] Test email format validation
- [ ] Test phone number format validation
- [ ] Test URL format validation
- [ ] Test currency validation with symbols
- [ ] Test automatic type conversion scenarios
- [ ] Test error message generation
- [ ] Test suggested fix generation
- [ ] All tests must pass: `npm run test lib/utils/validation-rules/data-type.test.ts`

## Lint Requirements

- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Use existing utility functions where applicable

## Status: 📋 Planned

Second core validation rule, building on the patterns established in VS-003.