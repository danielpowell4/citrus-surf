# 🍋 Citrus Surf Importer — Foundation Sprint Context

## 🏄‍♂️ What is Citrus Surf Importer?

A **workflow-first CSV importer and data prep tool** designed for developers and operations teams.

> _“Stop writing one-off CSV cleaning scripts. Upload, map, clean, validate, and export structured data fast.”_

- **Step 0 MVP:** A client-side app to prepare clean CSV/JSON files.
- **Long-term vision:** A resilient, user-friendly import pipeline with persistence, autosave, and backend import jobs.

---

## 🎯 Core Product Values

- ✅ **Transparency:** Show users what’s happening at every step.
- ✅ **Debuggability:** Errors are clear; users can self-serve fixes.
- ✅ **Resilience:** No work lost (autosave + history chain).
- ✅ **Simplicity:** Minimal clicks to prepare data for import.
- ✅ **Speed:** _“Life’s short. Go surfing.”_

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

---

## 🗂️ Step 0 MVP — Core Features

✔ Upload CSV/XLSX files or paste CSV/TSV data.  
✔ Map columns to target schema with auto-suggestions.  
✔ Apply transforms: merge/split columns, string helpers, first available (coalesce).  
✔ Validate data (required fields, type checks, preserve leading zeros).  
✔ Export cleaned dataset as CSV/JSON.  
✔ Local autosave + recoverable sessions.  
❌ No auth, backend persistence, or import jobs yet.

---

## 🧠 Why This Exists

Devs and ops teams waste hours:

- Cleaning spreadsheets with Google Sheets formulas.
- Writing brittle one-off scripts for every customer.
- Debugging “why did this row fail?” in opaque importers.

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

- 🍋 _Life’s short. Go surfing._
- Tools that help you go faster and spend less time on repetitive tasks.
- Friendly for developers. Sleek enough for ops folks.

---

## 🏃 2-Day Foundation Sprint (Key Questions)

### 🥇 1. What’s the product?

A self-serve CSV importer + data prep tool that makes cleaning and mapping data fast.

### 👤 2. Who is it for?

- Developers (stop writing import scripts).
- Ops teams (prepare clean data for APIs or databases).

### 🧱 3. What’s the MVP?

A client-only web app that:

- Uploads/pastes CSV data.
- Maps columns.
- Cleans and validates data.
- Exports clean CSV/JSON.

### 💥 4. What’s out of scope for MVP?

- No auth or persistence beyond local device.
- No backend import jobs.
- No Stripe billing or organizations.

---

## 🧪 Step 0 Testable Goals

✔ Import messy CSV data.  
✔ Fix column names, apply simple transforms.  
✔ Validate required fields and types.  
✔ Export clean data in <2 minutes.
