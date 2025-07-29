import type { TargetShape, ShapeTemplate } from "@/lib/types/target-shapes";
import { generateShapeId } from "@/lib/utils/id-generator";
import { storage } from "@/lib/utils/localStorage";

const STORAGE_KEY = "citrus-surf-target-shapes";
const TEMPLATES_KEY = "citrus-surf-shape-templates";

// Target Shapes Storage
export const targetShapesStorage = {
  // Get all saved shapes
  getAll(): TargetShape[] {
    try {
      const stored = storage.getItem<TargetShape[]>(STORAGE_KEY);
      return stored ?? [];
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shapes = this.getAll();
    shapes.push(newShape);
    storage.setItem(STORAGE_KEY, shapes);

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
      updatedAt: new Date().toISOString(),
    };

    storage.setItem(STORAGE_KEY, shapes);
    return shapes[index];
  },

  // Delete a shape
  delete(id: string): boolean {
    const shapes = this.getAll();
    const filtered = shapes.filter(shape => shape.id !== id);

    if (filtered.length === shapes.length) return false;

    storage.setItem(STORAGE_KEY, filtered);
    return true;
  },

  // Clear all shapes
  clear(): void {
    storage.removeItem(STORAGE_KEY);
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
      const custom = storage.getItem<ShapeTemplate[]>(TEMPLATES_KEY) ?? [];
      return [...defaultTemplates, ...custom];
    } catch (error) {
      console.error("Error loading templates:", error);
      return defaultTemplates;
    }
  },

  // Get only custom templates (excludes defaults)
  getCustom(): ShapeTemplate[] {
    try {
      return storage.getItem<ShapeTemplate[]>(TEMPLATES_KEY) ?? [];
    } catch (error) {
      console.error("Error loading custom templates:", error);
      return [];
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

  // Save a custom template
  save(template: Omit<ShapeTemplate, "id">): ShapeTemplate {
    const custom = this.getCustom();
    const newTemplate: ShapeTemplate = {
      ...template,
      id: `tmpl_custom_${Date.now()}`,
    };

    custom.push(newTemplate);
    storage.setItem(TEMPLATES_KEY, custom);
    return newTemplate;
  },

  // Update a custom template (cannot update default templates)
  update(id: string, updates: Partial<ShapeTemplate>): ShapeTemplate | null {
    const custom = this.getCustom();
    const index = custom.findIndex(template => template.id === id);

    if (index === -1) return null;

    custom[index] = {
      ...custom[index],
      ...updates,
    };

    storage.setItem(TEMPLATES_KEY, custom);
    return custom[index];
  },

  // Delete a custom template (cannot delete default templates)
  delete(id: string): boolean {
    const custom = this.getCustom();
    const filtered = custom.filter(template => template.id !== id);

    if (filtered.length === custom.length) return false;

    storage.setItem(TEMPLATES_KEY, filtered);
    return true;
  },

  // Check if template is custom (can be edited/deleted)
  isCustom(id: string): boolean {
    return !defaultTemplates.some(template => template.id === id);
  },
};
