# 🍋 Citrus Surf Importer — Foundation Sprint Context

## 🏄‍♂️ What is Citrus Surf Importer?

A **workflow-first CSV importer and data prep tool** designed for developers and operations teams.

> _“Stop writing one-off CSV cleaning scripts. Upload, map, clean, validate, and export structured data fast.”_

- **Step 0 MVP:** A client-side app to prepare clean CSV/JSON files.
- **Long-term vision:** A resilient, user-friendly import pipeline with persistence, autosave, and backend import jobs.

---

## 🎯 Core Product Values

- ✅ **Transparency:** Show users what's happening at every step.
- ✅ **Debuggability:** Errors are clear; users can self-serve fixes.
- ✅ **Resilience:** No work lost (autosave + history chain).
- ✅ **Simplicity:** Minimal clicks to prepare data for import.
- ✅ **Speed:** _“Life's short. Go surfing.”_

---

## 🛠️ Tech Stack (Step 0 MVP)

| Layer                | Tech                                    |
| -------------------- | --------------------------------------- |
| **Frontend**         | React + Next.js + Tailwind + shadcn/ui  |
| **State Management** | Redux Toolkit + Redux Saga              |
| **Grid Component**   | TanStack Table                          |
| **Parsing**          | PapaParse (CSV) + SheetJS (Excel)       |
| **Persistence**      | IndexedDB (localForage) or localStorage |
| **Testing**          | Vitest + React Testing Library          |
| **Export**           | Client-side CSV/JSON download           |
| **Hosting**          | Vercel/Fly.io (Step 0 has no backend)   |

### 🎨 UI Component Architecture

**shadcn/ui + Radix UI Relationship:**

- **shadcn/ui** is NOT a package dependency - it's a collection of reusable components copied into `components/ui/`
- **Radix UI** primitives are the underlying dependencies that shadcn/ui components are built on
- **Current setup:** All UI components use shadcn/ui patterns with Radix UI primitives
- **Benefits:** No bundle bloat, full customization, no version conflicts

**Key Dependencies:**

- `@radix-ui/react-*` packages: Primitives for accessibility and behavior
- `components/ui/*.tsx`: shadcn/ui components (part of codebase, not dependencies)
- `class-variance-authority`, `clsx`, `tailwind-merge`: Utility libraries for styling

**Adding New Components:**

```bash
npx shadcn@latest add [component-name]
# This copies the component to components/ui/ and adds necessary Radix UI primitives
```

---

## 🗂️ Step 0 MVP — Core Features

✔ Upload CSV/XLSX files or paste CSV/TSV data.  
✔ Define Target Shapes for desired output formats.  
✔ Map columns to target shapes with auto-suggestions.  
✔ Apply transforms: merge/split columns, string helpers, first available (coalesce).  
✔ Validate data against shape rules (required fields, type checks, business rules).  
✔ Export cleaned dataset as CSV/JSON matching target shape.  
✔ Local autosave + recoverable sessions.  
❌ No auth, backend persistence, or import jobs yet.

### 🎯 Target Shapes System

Target Shapes define the desired clean output format for data imports. They act as "molds" that transform messy data into consistent, validated formats.

**Key Benefits:**

- **Consistency** - All imports follow the same format
- **Quality** - Built-in validation prevents bad data
- **Efficiency** - Reusable shapes save time
- **Clarity** - Clear expectations for data format

**Documentation:** See `docs/target-shapes.md` for complete system documentation.

---

## 🧠 Why This Exists

Devs and ops teams waste hours:

- Cleaning spreadsheets with Google Sheets formulas.
- Writing brittle one-off scripts for every customer.
- Debugging "why did this row fail?" in opaque importers.

**Citrus Surf Importer** fixes that by making data prep:

- Workflow-first
- Transparent
- Fast

---

## 🏗️ High-Level Architecture

```plaintext
Upload File/Paste Data
      ↓
Parse (CSV/XLSX → rows + headers)
      ↓
Column Mapping UI (suggested matches)
      ↓
Transforms (merge, split, string helpers, etc.)
      ↓
Validation (required fields, types, leading zeros)
      ↓
Export Clean Data (CSV/JSON)
```

---

## 🏄‍♂️ Citrus Surf Brand Ethos

- 🍋 _Life's short. Go surfing._
- Tools that help you go faster and spend less time on repetitive tasks.
- Friendly for developers. Sleek enough for ops folks.

---

## 🏃 2-Day Foundation Sprint (Key Questions)

### 🥇 1. What's the product?

A self-serve CSV importer + data prep tool that makes cleaning and mapping data fast.

### 👤 2. Who is it for?

- Developers (stop writing import scripts).
- Ops teams (prepare clean data for APIs or databases).

### 🧱 3. What's the MVP?

A client-only web app that:

- Uploads/pastes CSV data.
- Maps columns.
- Cleans and validates data.
- Exports clean CSV/JSON.

### 💥 4. What's out of scope for MVP?

- No auth or persistence beyond local device.
- No backend import jobs.
- No Stripe billing or organizations.

---

## 🧪 Step 0 Testable Goals

✔ Import messy CSV data.  
✔ Fix column names, apply simple transforms.  
✔ Validate required fields and types.  
✔ Export clean data in <2 minutes.
