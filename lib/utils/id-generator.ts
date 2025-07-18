import { ulid } from "ulid";

/**
 * Generate unique IDs with prefixes (like Stripe/Clerk)
 *
 * Examples:
 * - shape_01H9X2K3L4M5N6P7Q8R9S0T1U
 * - field_01H9X2K3L4M5N6P7Q8R9S0T1U
 * - tmpl_01H9X2K3L4M5N6P7Q8R9S0T1U
 * - val_01H9X2K3L4M5N6P7Q8R9S0T1U
 */
export const generateId = (prefix: string): string => {
  return `${prefix}_${ulid()}`;
};

// Common ID prefixes
export const ID_PREFIXES = {
  SHAPE: "shape",
  FIELD: "field",
  TEMPLATE: "tmpl",
  VALIDATION: "val",
  TRANSFORMATION: "trans",
  ROW: "cs",
} as const;

// Convenience functions for common ID types
export const generateShapeId = () => generateId(ID_PREFIXES.SHAPE);
export const generateFieldId = () => generateId(ID_PREFIXES.FIELD);
export const generateTemplateId = () => generateId(ID_PREFIXES.TEMPLATE);
export const generateValidationId = () => generateId(ID_PREFIXES.VALIDATION);
export const generateTransformationId = () =>
  generateId(ID_PREFIXES.TRANSFORMATION);
export const generateRowId = () => generateId(ID_PREFIXES.ROW);

// Validate ID format
export const isValidId = (id: string, prefix?: string): boolean => {
  const idPattern = /^[a-z]+_[0-9A-Z]{26}$/;
  if (!idPattern.test(id)) return false;

  if (prefix) {
    return id.startsWith(`${prefix}_`);
  }

  return true;
};

// Extract prefix from ID
export const getPrefixFromId = (id: string): string | null => {
  const match = id.match(/^([a-z]+)_/);
  return match ? match[1] : null;
};
