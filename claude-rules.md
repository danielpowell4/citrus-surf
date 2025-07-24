# 🍋 Citrus Surf Claude Rules

## Core Product Principles
- **Transparency**: Always explain what changes you're making and why
- **Debuggability**: Provide clear error messages and troubleshooting steps
- **Resilience**: Never break existing functionality; preserve user data
- **Simplicity**: Minimize complexity; favor straightforward solutions
- **Speed**: Optimize for developer velocity and user experience

## Tech Stack Adherence
- **Frontend**: Use React + Next.js + Tailwind + shadcn/ui patterns only
- **State**: Redux Toolkit + Redux Saga for all state management
- **UI Components**: Always use shadcn/ui components from `components/ui/` 
- **Grid**: Use TanStack Table for all data display
- **Parsing**: PapaParse for CSV, SheetJS for Excel
- **Testing**: Vitest + React Testing Library
- **Persistence**: IndexedDB (localForage) or localStorage

## Code Conventions
- Follow existing TypeScript patterns in the codebase
- Use existing utility functions before creating new ones
- Maintain consistent naming: kebab-case for files, camelCase for variables
- All new components must follow shadcn/ui patterns
- Use Radix UI primitives for accessibility

## Target Shapes System Rules
- Never modify target shape core logic without understanding full impact
- All data transformations must go through the target shapes system
- Preserve validation rules and type checking
- Reference `docs/target-shapes.md` for implementation guidance

## Documentation Requirements
- **Write docs as you go** - Document new features alongside implementation
- Update relevant docs in `docs/` folder when making changes
- Follow markdown standards with clear headers and code examples
- Include TypeScript examples for all new APIs
- Cross-reference related documentation
- Never ship code without corresponding documentation updates

## File Management
- **Never create new files** unless absolutely necessary
- **Always prefer editing existing files**
- **Never create documentation files** unless explicitly requested
- Check existing patterns before implementing new solutions

## Testing Standards
- **Write tests as you go** - Create tests alongside implementation, never after
- **Run tests before moving on** - Ensure all tests pass before proceeding to next task
- **Evolve tests with code** - Update existing tests when requirements or implementation change
- Use Vitest for all testing
- Follow existing test patterns in the codebase
- Test data transformation logic thoroughly
- Verify UI components with React Testing Library
- Never ship code without corresponding test coverage
- When refactoring, update tests to match new behavior expectations

## Performance Guidelines
- Client-side only processing (no backend in Step 0)
- Optimize for large CSV file handling
- Use debouncing for state persistence
- Minimize re-renders in data grid

## Brand Alignment
- Maintain "Life's short. Go surfing." ethos
- Keep UX simple and intuitive
- Focus on developer and ops team workflows
- Prioritize speed and efficiency

## State Management Patterns
- Use Redux Toolkit slices for all state
- Implement Redux Saga for async operations
- Follow established persistence patterns
- Maintain immutable state updates

## UI/UX Guidelines
- Follow shadcn/ui design system
- Ensure accessibility with Radix UI primitives
- Maintain responsive design patterns
- Use consistent spacing and typography

## Data Processing Rules
- Validate all inputs through target shapes
- Handle errors gracefully with user-friendly messages
- Preserve data integrity throughout transformations
- Support large file processing efficiently

## Development Workflow
- Read existing code before making changes
- Follow established patterns and conventions
- Test changes thoroughly before committing
- Update documentation alongside code changes