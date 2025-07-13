# Citrus Surf

A collection of simple, powerful tools to help you work with your data more efficiently. Built with Next.js and Tailwind CSS.

## About This Project

This project was originally generated using [v0.dev](https://v0.dev) and has been transitioned to a human-powered development workflow. It includes various data transformation tools like CSV to JSON, JSON diffing, SQL generation, and more.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with custom design system
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives
- **Theme**: Dark/light mode support with [next-themes](https://github.com/pacocoursey/next-themes)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Tailwind CSS Setup

This project uses **Tailwind CSS v3.4.17** (stable) rather than v4 (alpha) for better stability and full `@apply` directive support. The configuration includes:

- Custom CSS variables for theming (light/dark mode)
- Full `@apply` directive support for all utilities
- Custom scrollbar styling
- Typography plugin for rich text content

### Key Configuration Files

- `tailwind.config.ts` - Main configuration with custom colors and theme
- `postcss.config.mjs` - PostCSS setup with Tailwind and Autoprefixer
- `app/globals.css` - Global styles with CSS variables and custom utilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
pnpm build
pnpm start
```

## Available Tools

- **CSV to JSON** - Convert CSV data to JSON format
- **JSON Diff** - Compare and visualize differences between JSON objects
- **JSON to CSV** - Convert JSON data to CSV format
- **JSON to SQL** - Generate SQL INSERT statements from JSON data
- **Slugify** - Convert text to URL-friendly slugs
- **Spreadsheet to SQL Values** - Convert spreadsheet data to SQL VALUES format

## Development Notes

### Transition from v0.dev

This project was originally generated using v0.dev and has been manually enhanced with:

- Improved TypeScript types and error handling
- Enhanced UI/UX with better accessibility
- Additional data transformation tools
- Custom styling and theming
- Performance optimizations

### Tailwind CSS Migration

The project was migrated from Tailwind CSS v4 (alpha) to v3.4 (stable) to ensure:

- Full `@apply` directive support
- Better stability and documentation
- Compatibility with existing v0.dev generated code
- Production-ready reliability

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
