# VS-003: Required Field Validation Rule

## Context

Implement the required field validation rule that checks for empty/null/undefined values in fields marked as required in the target shape. This is the most fundamental validation rule for data quality assurance.

## Acceptance Criteria

### AC1: RequiredFieldRule Implementation

- [ ] Create `RequiredFieldRule` class extending `BaseValidationRule`
- [ ] Rule ID: 'required-field'
- [ ] Rule type: 'required'
- [ ] Severity: 'error'
- [ ] Validate that required fields are not null, undefined, empty string, or whitespace-only

### AC2: Validation Logic

- [ ] Return error for null values when field.required = true
- [ ] Return error for undefined values when field.required = true
- [ ] Return error for empty strings ("") when field.required = true
- [ ] Return error for whitespace-only strings ("   ") when field.required = true
- [ ] Return valid for non-empty values
- [ ] Skip validation when field.required = false

### AC3: Error Messages

- [ ] Generate descriptive error message: "Field '{fieldName}' is required but is empty"
- [ ] Include field display name in error messages when available
- [ ] Provide contextual error messages based on field type

### AC4: Suggested Fixes

- [ ] For text fields: suggest "Enter a value for {fieldName}"
- [ ] For enum fields: suggest first available option
- [ ] For date fields: suggest current date
- [ ] For number fields: suggest 0 or field minimum

## Technical Requirements

- Handle all JavaScript falsy values appropriately
- Support custom empty value definitions per field type
- Integrate with existing target shape field definitions
- Performance optimized for batch validation

## Testing Requirements

- [ ] Test required field validation with null values
- [ ] Test required field validation with undefined values
- [ ] Test required field validation with empty strings
- [ ] Test required field validation with whitespace-only strings
- [ ] Test optional field validation (should pass with empty values)
- [ ] Test error message generation for different field types
- [ ] Test suggested fix generation for different field types
- [ ] Performance test with 1000+ rows
- [ ] All tests must pass: `npm run test lib/utils/validation-rules/required-field.test.ts`

## Lint Requirements

- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing validation rule patterns

## Implementation Notes

**File Structure:**
- `lib/utils/validation-rules/required-field-rule.ts` - Rule implementation
- `lib/utils/validation-rules/required-field-rule.test.ts` - Comprehensive tests
- `lib/utils/validation-rules/index.ts` - Export barrel file

**Integration Points:**
- Extends BaseValidationRule from VS-002
- Uses validation types from VS-001
- Integrates with TargetField definitions

**Edge Cases to Handle:**
- Different field types (string, number, date, enum)
- Trimming whitespace for string validation
- Custom required validation for specific field types
- Graceful handling of malformed field definitions

## Status: 📋 Planned

Next ticket in the validation rules phase. Will provide the foundation for all other validation rules by establishing the pattern for rule implementation and testing.