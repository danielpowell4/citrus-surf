# VS-005: Enum Validation Rule

## Context

Implement enum validation that ensures values match predefined options in enum fields, with fuzzy matching and smart suggestion capabilities for partial matches and typos.

## Acceptance Criteria

### AC1: EnumRule Implementation

- [ ] Create `EnumRule` class extending `BaseValidationRule`
- [ ] Rule ID: 'enum-validation'
- [ ] Rule type: 'enum'
- [ ] Severity: 'error' for invalid values, 'warning' for fuzzy matches
- [ ] Support both value and label validation

### AC2: Exact Match Validation

- [ ] Validate against enum option values (primary validation)
- [ ] Validate against enum option labels (secondary validation)
- [ ] Case-insensitive matching option
- [ ] Whitespace normalization for comparisons

### AC3: Fuzzy Match Support

- [ ] Implement fuzzy string matching for close matches
- [ ] Configurable similarity threshold (default 0.8)
- [ ] Use Levenshtein distance algorithm for string similarity
- [ ] Generate warnings for fuzzy matches with confidence scores

### AC4: Smart Suggestions

- [ ] Suggest exact matches when available
- [ ] Suggest best fuzzy matches with confidence scores
- [ ] Rank suggestions by similarity and frequency
- [ ] Include context about why suggestion was chosen

## Technical Requirements

- Integrate with existing string similarity utilities
- Support large enum option sets (100+ options)
- Configurable fuzzy matching thresholds
- Performance optimized for real-time validation

## Testing Requirements

- [ ] Test exact value matching (case sensitive/insensitive)
- [ ] Test exact label matching 
- [ ] Test fuzzy matching with various similarity thresholds
- [ ] Test suggestion ranking and confidence scoring
- [ ] Test performance with large enum option sets (100+ options)
- [ ] Test edge cases: empty values, null options, special characters
- [ ] All tests must pass: `npm run test lib/utils/validation-rules/enum.test.ts`

## Lint Requirements

- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing string matching patterns

## Status: 📋 Planned

Third core validation rule, adding intelligent enum validation with fuzzy matching capabilities.