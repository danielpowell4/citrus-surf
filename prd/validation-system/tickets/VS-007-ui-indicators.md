# VS-007: Validation Status UI Indicators

## Context

Create visual indicators and status displays that show validation errors and warnings directly in the data table interface, providing immediate feedback about data quality issues.

## Acceptance Criteria

### AC1: Cell-Level Indicators

- [ ] Red border/background for cells with validation errors
- [ ] Orange border/background for cells with validation warnings
- [ ] Error/warning icon overlays on problematic cells
- [ ] Hover tooltips showing validation messages
- [ ] Support for multiple errors per cell

### AC2: Row-Level Indicators

- [ ] Row highlighting for rows containing validation issues
- [ ] Row status icons (error/warning/valid) in dedicated column
- [ ] Error count badges showing total issues per row
- [ ] Visual distinction between error and warning severity

### AC3: Table-Level Summary

- [ ] Validation summary header showing overall status
- [ ] Total error and warning counts
- [ ] Progress indicator during validation processing
- [ ] Validation timestamp and status indicator

### AC4: Accessibility Compliance

- [ ] ARIA labels for all validation indicators
- [ ] Screen reader announcements for validation state changes
- [ ] High contrast mode support
- [ ] Keyboard navigation to validation errors
- [ ] Focus management for error resolution workflows

## Technical Requirements

- Integrate with existing TanStack Table components
- Follow shadcn/ui design patterns and theming
- Support both light and dark mode themes
- Performant rendering for large datasets

## Testing Requirements

- [ ] Test cell indicator rendering for errors and warnings
- [ ] Test row indicator display and interaction
- [ ] Test table summary accuracy and updates
- [ ] Test accessibility features (ARIA, keyboard navigation)
- [ ] Test theme support (light/dark mode)
- [ ] Test performance with large datasets
- [ ] All tests must pass: `npm run test components/validation-indicators.test.tsx`

## Lint Requirements

- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing component patterns

## Status: 📋 Planned

Essential UI foundation for the validation system user experience.