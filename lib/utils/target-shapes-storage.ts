import type { TargetShape, ShapeTemplate } from "@/lib/types/target-shapes";
import { generateShapeId } from "@/lib/utils/id-generator";

const STORAGE_KEY = "citrus-surf-target-shapes";
const TEMPLATES_KEY = "citrus-surf-shape-templates";

// Target Shapes Storage
export const targetShapesStorage = {
  // Get all saved shapes
  getAll(): TargetShape[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading target shapes:", error);
      return [];
    }
  },

  // Get a specific shape by ID
  getById(id: string): TargetShape | null {
    const shapes = this.getAll();
    return shapes.find(shape => shape.id === id) || null;
  },

  // Save a new shape
  save(
    shape: Omit<TargetShape, "id" | "createdAt" | "updatedAt">
  ): TargetShape {
    const newShape: TargetShape = {
      ...shape,
      id: generateShapeId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const shapes = this.getAll();
    shapes.push(newShape);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes));

    return newShape;
  },

  // Update an existing shape
  update(id: string, updates: Partial<TargetShape>): TargetShape | null {
    const shapes = this.getAll();
    const index = shapes.findIndex(shape => shape.id === id);

    if (index === -1) return null;

    shapes[index] = {
      ...shapes[index],
      ...updates,
      updatedAt: new Date(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes));
    return shapes[index];
  },

  // Delete a shape
  delete(id: string): boolean {
    const shapes = this.getAll();
    const filtered = shapes.filter(shape => shape.id !== id);

    if (filtered.length === shapes.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // Clear all shapes
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Pre-built Templates
export const defaultTemplates: ShapeTemplate[] = [
  {
    id: "tmpl_customer_db",
    name: "Customer Database",
    description: "Standard customer record format for CRM import",
    category: "CRM",
    shape: {
      name: "Customer Database",
      description: "Standard customer record format for CRM import",
      version: "1.0.0",
      fields: [
        {
          id: "field_customer_id",
          name: "Customer ID",
          type: "string",
          required: true,
          validation: [
            {
              type: "pattern",
              value: "^CUST-\\d{6}$",
              message: "Must be CUST-XXXXXX format",
              severity: "error",
            },
          ],
        },
        {
          id: "field_email",
          name: "Email Address",
          type: "email",
          required: true,
          validation: [
            {
              type: "pattern",
              value: "^[^@]+@[^@]+\\.[^@]+$",
              message: "Invalid email format",
              severity: "error",
            },
          ],
          transformation: [
            { type: "lowercase", parameters: {}, order: 1 },
            { type: "trim", parameters: {}, order: 2 },
          ],
        },
        {
          id: "field_full_name",
          name: "Full Name",
          type: "string",
          required: true,
          transformation: [
            { type: "trim", parameters: {}, order: 1 },
            {
              type: "replace",
              parameters: { search: "\\s+", replace: " " },
              order: 2,
            },
          ],
        },
        {
          id: "field_phone",
          name: "Phone Number",
          type: "phone",
          required: false,
          transformation: [
            {
              type: "replace",
              parameters: { search: "[^\\d+]", replace: "" },
              order: 1,
            },
          ],
        },
        {
          id: "field_status",
          name: "Status",
          type: "enum",
          required: true,
          defaultValue: "active",
          validation: [
            {
              type: "enum",
              value: ["active", "inactive", "pending"],
              message: "Invalid status",
              severity: "error",
            },
          ],
        },
      ],
    },
  },
  {
    id: "tmpl_employee_records",
    name: "Employee Records",
    description: "Employee database format for HR systems",
    category: "HR",
    shape: {
      name: "Employee Records",
      description: "Employee database format for HR systems",
      version: "1.0.0",
      fields: [
        {
          id: "field_employee_id",
          name: "Employee ID",
          type: "string",
          required: true,
          validation: [
            {
              type: "pattern",
              value: "^E\\d{3}$",
              message: "Must be EXXX format",
              severity: "error",
            },
          ],
        },
        {
          id: "field_full_name",
          name: "Full Name",
          type: "string",
          required: true,
          transformation: [
            { type: "trim", parameters: {}, order: 1 },
            {
              type: "replace",
              parameters: { search: "\\s+", replace: " " },
              order: 2,
            },
          ],
        },
        {
          id: "field_email",
          name: "Email",
          type: "email",
          required: true,
          validation: [
            {
              type: "pattern",
              value: "^[^@]+@[^@]+\\.[^@]+$",
              message: "Invalid email format",
              severity: "error",
            },
          ],
          transformation: [{ type: "lowercase", parameters: {}, order: 1 }],
        },
        {
          id: "field_department",
          name: "Department",
          type: "string",
          required: true,
          transformation: [{ type: "uppercase", parameters: {}, order: 1 }],
        },
        {
          id: "field_salary",
          name: "Salary",
          type: "currency",
          required: false,
          validation: [
            {
              type: "min",
              value: 0,
              message: "Salary must be positive",
              severity: "error",
            },
          ],
        },
      ],
    },
  },
];

// Template Storage
export const templateStorage = {
  // Get all templates (combines default + custom)
  getAll(): ShapeTemplate[] {
    try {
      const customTemplates = localStorage.getItem(TEMPLATES_KEY);
      const custom = customTemplates ? JSON.parse(customTemplates) : [];
      return [...defaultTemplates, ...custom];
    } catch (error) {
      console.error("Error loading templates:", error);
      return defaultTemplates;
    }
  },

  // Get templates by category
  getByCategory(category: string): ShapeTemplate[] {
    return this.getAll().filter(template => template.category === category);
  },

  // Get a specific template by ID
  getById(id: string): ShapeTemplate | null {
    return this.getAll().find(template => template.id === id) || null;
  },
};
