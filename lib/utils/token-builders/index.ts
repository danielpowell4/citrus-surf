/**
 * Token Builder System - Main Export
 * 
 * Provides a centralized token generation system for field mapping suggestions.
 * Easily extensible for new field types and matching patterns.
 */

export * from "./base-token-builder";
export * from "./field-specific-builders";

import { 
  defaultTokenRegistry, 
  GenericTokenBuilder,
  type TokenContext,
  type TokenResult 
} from "./base-token-builder";

import {
  EmailTokenBuilder,
  PhoneTokenBuilder,
  NameTokenBuilder,
  IdTokenBuilder,
  DateTimeTokenBuilder,
  NumericTokenBuilder,
  AddressTokenBuilder,
  UrlTokenBuilder,
} from "./field-specific-builders";

/**
 * Initialize the default token registry with all built-in builders
 */
function initializeDefaultRegistry(): void {
  // Clear any existing builders
  defaultTokenRegistry.clear();
  
  // Register field-specific builders (higher priority)
  defaultTokenRegistry.register(new EmailTokenBuilder());
  defaultTokenRegistry.register(new PhoneTokenBuilder());
  defaultTokenRegistry.register(new UrlTokenBuilder());
  defaultTokenRegistry.register(new IdTokenBuilder());
  defaultTokenRegistry.register(new NameTokenBuilder());
  defaultTokenRegistry.register(new AddressTokenBuilder());
  defaultTokenRegistry.register(new DateTimeTokenBuilder());
  defaultTokenRegistry.register(new NumericTokenBuilder());
  
  // Register generic builder (lowest priority - fallback)
  defaultTokenRegistry.register(new GenericTokenBuilder());
}

// Initialize the default registry
initializeDefaultRegistry();

/**
 * Main interface for generating field variations using the token builder system
 */
export function generateFieldVariations(
  fieldName: string, 
  fieldId: string, 
  fieldType?: import("@/lib/types/target-shapes").FieldType
): Set<string> {
  const context: TokenContext = {
    fieldName,
    fieldId,
    fieldType,
    isSource: false,
  };
  
  const result = defaultTokenRegistry.generateTokens(context);
  return result.tokens;
}

/**
 * Generate variations for source columns (imported data)
 */
export function generateColumnVariations(columnName: string): Set<string> {
  const context: TokenContext = {
    fieldName: columnName,
    fieldId: columnName,
    isSource: true,
  };
  
  const result = defaultTokenRegistry.generateTokens(context);
  return result.tokens;
}

/**
 * Get detailed token generation results with metadata
 */
export function generateFieldVariationsWithMetadata(
  fieldName: string, 
  fieldId: string, 
  fieldType?: import("@/lib/types/target-shapes").FieldType
): TokenResult {
  const context: TokenContext = {
    fieldName,
    fieldId,
    fieldType,
    isSource: false,
  };
  
  return defaultTokenRegistry.generateTokens(context);
}

/**
 * Add a custom token builder to the registry
 */
export function addCustomTokenBuilder(builder: import("./base-token-builder").ITokenBuilder): void {
  defaultTokenRegistry.register(builder);
}

/**
 * Get information about registered token builders
 */
export function getRegisteredBuilders(): import("./base-token-builder").ITokenBuilder[] {
  return defaultTokenRegistry.getBuilders();
}

/**
 * Reset the token registry to default state
 */
export function resetTokenRegistry(): void {
  initializeDefaultRegistry();
}

/**
 * Example of how to add a new field type builder
 * 
 * ```typescript
 * import { BaseTokenBuilder, addCustomTokenBuilder } from './token-builders';
 * 
 * class CustomFieldTokenBuilder extends BaseTokenBuilder {
 *   priority = 85;
 *   supportedTypes = ['custom_type'];
 *   
 *   generateTokens(context) {
 *     const tokens = new Set<string>();
 *     // Add custom token generation logic
 *     return { tokens };
 *   }
 * }
 * 
 * addCustomTokenBuilder(new CustomFieldTokenBuilder());
 * ```
 */