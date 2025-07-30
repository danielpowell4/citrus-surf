# 🎨 Citrus Surf Style Guide

## Overview

This style guide ensures consistent, accessible, and theme-aware UI components across the Citrus Surf application. All components must support both light and dark modes and follow shadcn/ui design patterns.

## 🌓 Theming System

### Core Principle

**Every UI element must work perfectly in both light and dark modes.**

### Implementation

- Uses CSS variables defined in `app/globals.css`
- Tailwind's `dark:` modifier for dark mode variants
- Semantic color tokens for consistency

### Color System

#### Semantic Colors (ALWAYS USE THESE)

```css
/* Backgrounds */
bg-background      /* Main app background */
bg-card           /* Elevated surfaces (cards, modals) */
bg-popover        /* Overlay content */
bg-muted          /* Subtle backgrounds */

/* Text */
text-foreground         /* Primary text */
text-muted-foreground  /* Secondary text */
text-card-foreground   /* Text on card backgrounds */

/* Borders */
border-border     /* Standard borders */
border-input      /* Form element borders */

/* Interactive */
bg-primary        /* Primary buttons, links */
bg-secondary      /* Secondary buttons */
bg-accent         /* Hover states, highlights */
bg-destructive    /* Error states, delete actions */
```

#### Custom Colors (USE WITH DARK VARIANTS)

When semantic colors aren't sufficient, always provide dark mode variants:

```tsx
// ✅ CORRECT - Both light and dark variants
className =
  "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";

// ❌ WRONG - Only light mode
className = "bg-blue-50 border-blue-200 text-blue-900";
```

## 📋 Component Patterns

### Cards and Containers

```tsx
// Standard card
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// Custom colored container
<div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
  <div className="text-green-800 dark:text-green-200">Success message</div>
</div>
```

### Buttons

```tsx
// Primary action
<Button>Primary Action</Button>

// Secondary action
<Button variant="secondary">Secondary Action</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost/minimal
<Button variant="ghost">Cancel</Button>

// Outline
<Button variant="outline">More Options</Button>
```

### Text Hierarchy

```tsx
// Page title
<h1 className="text-2xl sm:text-3xl font-bold">Page Title</h1>

// Section title
<h2 className="text-lg font-semibold">Section Title</h2>

// Card title
<CardTitle className="flex items-center gap-2">
  <Icon className="w-5 h-5" />
  Card Title
</CardTitle>

// Body text
<p className="text-foreground">Primary content</p>

// Secondary text
<p className="text-muted-foreground text-sm">Secondary information</p>
```

### Status Indicators

```tsx
// Success
<Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
  Success
</Badge>

// Warning
<Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
  Warning
</Badge>

// Error
<Badge variant="destructive">Error</Badge>

// Info
<Badge variant="secondary">Info</Badge>
```

### Form Elements

```tsx
// Input with label
<div className="space-y-2">
  <Label htmlFor="input">Field Label</Label>
  <Input id="input" placeholder="Enter value..." />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>

// Select dropdown
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## 🎯 Color Combinations

### Recommended Pairings

#### Blue Theme (Information, Primary Actions)

```tsx
className =
  "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
```

#### Green Theme (Success, Positive Actions)

```tsx
className =
  "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";
```

#### Yellow Theme (Warnings, Attention)

```tsx
className =
  "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";
```

#### Red Theme (Errors, Destructive Actions)

```tsx
className =
  "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100";
```

## 🔧 Testing Checklist

Before marking any UI component as complete:

- [ ] Component renders correctly in light mode
- [ ] Component renders correctly in dark mode
- [ ] Text has sufficient contrast in both modes
- [ ] Interactive states (hover, focus, active) work in both modes
- [ ] No hardcoded colors are used
- [ ] Semantic tokens are used where possible
- [ ] Custom colors include dark variants

## 🚫 Common Mistakes

### ❌ Hardcoded Colors

```tsx
// DON'T
className = "bg-white text-black border-gray-300";
```

### ✅ Semantic Tokens

```tsx
// DO
className = "bg-card text-card-foreground border-border";
```

### ❌ Missing Dark Variants

```tsx
// DON'T
className = "bg-blue-100 text-blue-800";
```

### ✅ Complete Theme Support

```tsx
// DO
className = "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
```

### ❌ Insufficient Contrast

```tsx
// DON'T - Poor contrast in dark mode
className = "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-600";
```

### ✅ Good Contrast

```tsx
// DO - Clear contrast in both modes
className = "bg-muted text-muted-foreground";
```

## 🎨 Brand Colors

### Primary Palette

- **Citrus Orange**: Used sparingly for brand elements
- **Ocean Blue**: Primary interactive elements
- **Fresh Green**: Success states, positive actions
- **Warm Gray**: Neutral content, backgrounds

### Usage Guidelines

- Keep brand colors minimal and purposeful
- Use semantic tokens for 90% of styling
- Brand colors should enhance, not overwhelm
- Maintain accessibility standards (WCAG AA)

## 📱 Responsive Design

### Breakpoint Strategy

```tsx
// Mobile-first approach
className = "text-sm sm:text-base lg:text-lg";
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
className = "p-4 sm:p-6 lg:p-8";
```

### Component Adaptations

- Cards stack on mobile, arrange in grids on desktop
- Navigation collapses to hamburger on small screens
- Text sizes scale appropriately
- Touch targets are minimum 44px on mobile

## 🔍 Accessibility Requirements

### Color and Contrast

- Text contrast ratio ≥ 4.5:1 (WCAG AA)
- Interactive elements clearly distinguishable
- Don't rely solely on color to convey information

### Focus Management

- Visible focus indicators on all interactive elements
- Logical tab order
- Proper heading hierarchy (h1 → h2 → h3)

### Screen Reader Support

- Meaningful alt text for images
- Proper ARIA labels for complex interactions
- Semantic HTML structure

## 🛠️ Implementation Tools

### Development

```bash
# Add new shadcn/ui component
npx shadcn@latest add [component-name]

# Preview themes
# Toggle between light/dark mode in browser dev tools
```

### Testing

```bash
# Visual regression testing (future)
npm run test:visual

# Accessibility testing
npm run test:a11y
```

This style guide ensures that the Citrus Surf application maintains a consistent, professional appearance while supporting all users across different themes and devices.
