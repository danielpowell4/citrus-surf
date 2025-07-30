/**
 * Abstract Token Builder System
 *
 * Provides a flexible, extensible system for generating token variations
 * for different field types in the mapping suggestion engine.
 */

import type { FieldType } from "@/lib/types/target-shapes";

/**
 * Token generation context for field-specific builders
 */
export interface TokenContext {
  fieldName: string;
  fieldId: string;
  fieldType?: FieldType;
  isSource?: boolean; // true for source columns, false for target fields
}

/**
 * Result of token generation with metadata
 */
export interface TokenResult {
  tokens: Set<string>;
  metadata?: {
    primaryTokens?: string[];
    abbreviations?: string[];
    synonyms?: string[];
    caseVariations?: string[];
  };
}

/**
 * Base interface for all token builders
 */
export interface ITokenBuilder {
  /**
   * Generate tokens for a given context
   */
  generateTokens(context: TokenContext): TokenResult;

  /**
   * Check if this builder can handle the given context
   */
  canHandle(context: TokenContext): boolean;

  /**
   * Priority for this builder (higher = more specific, runs first)
   */
  priority: number;

  /**
   * Supported field types (empty means applies to all)
   */
  supportedTypes: FieldType[];
}

/**
 * Abstract base class for token builders
 */
export abstract class BaseTokenBuilder implements ITokenBuilder {
  abstract priority: number;
  abstract supportedTypes: FieldType[];

  abstract generateTokens(context: TokenContext): TokenResult;

  canHandle(context: TokenContext): boolean {
    // Default implementation: check if field type is supported
    if (this.supportedTypes.length === 0) return true;
    if (!context.fieldType) {
      // For source columns (no field type), only apply generic builder by default
      // Specialized builders should override this method to check keywords/patterns
      return false;
    }
    return this.supportedTypes.includes(context.fieldType);
  }

  /**
   * Common utility: Convert string to snake_case
   */
  protected toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  /**
   * Common utility: Convert string to camelCase
   */
  protected toCamelCase(str: string): string {
    // If already camelCase, return as is
    if (/^[a-z][a-zA-Z0-9]*$/.test(str)) {
      return str;
    }

    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, chr => chr.toLowerCase());
  }

  /**
   * Common utility: Generate basic case variations
   */
  protected generateCaseVariations(input: string): Set<string> {
    const variations = new Set<string>();

    variations.add(input.toLowerCase());
    variations.add(this.toSnakeCase(input));
    variations.add(this.toCamelCase(input));

    return variations;
  }

  /**
   * Common utility: Clean prefixes and suffixes
   */
  protected cleanFieldName(input: string): string {
    return input
      .replace(/^(field_?|col_?|column_?)/i, "")
      .replace(/(_?field|_?col|_?column)$/i, "");
  }

  /**
   * Common utility: Check if a string contains any of the given keywords
   */
  protected containsKeywords(str: string, keywords: string[]): boolean {
    const lowerStr = str.toLowerCase();
    return keywords.some(keyword => lowerStr.includes(keyword.toLowerCase()));
  }
}

/**
 * Generic token builder for basic field operations
 */
export class GenericTokenBuilder extends BaseTokenBuilder {
  priority = 0; // Lowest priority - runs last as fallback
  supportedTypes: FieldType[] = []; // Supports all types

  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    const { fieldName, fieldId } = context;

    // Add original values
    tokens.add(fieldName.toLowerCase());
    tokens.add(fieldId.toLowerCase());

    // Add case variations
    this.generateCaseVariations(fieldName).forEach(token => tokens.add(token));
    this.generateCaseVariations(fieldId).forEach(token => tokens.add(token));

    // Add cleaned variations
    const cleanFieldName = this.cleanFieldName(fieldName);
    const cleanFieldId = this.cleanFieldName(fieldId);

    if (cleanFieldName && cleanFieldName !== fieldName) {
      this.generateCaseVariations(cleanFieldName).forEach(token =>
        tokens.add(token)
      );
    }

    if (cleanFieldId && cleanFieldId !== fieldId) {
      this.generateCaseVariations(cleanFieldId).forEach(token =>
        tokens.add(token)
      );
    }

    return {
      tokens,
      metadata: {
        caseVariations: Array.from(this.generateCaseVariations(fieldName)),
      },
    };
  }
}

/**
 * Token builder registry for managing and applying token builders
 */
export class TokenBuilderRegistry {
  private builders: ITokenBuilder[] = [];

  /**
   * Register a new token builder
   */
  register(builder: ITokenBuilder): void {
    this.builders.push(builder);
    // Sort by priority (higher first)
    this.builders.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate tokens for a given context using all applicable builders
   */
  generateTokens(context: TokenContext): TokenResult {
    const allTokens = new Set<string>();
    const combinedMetadata: TokenResult["metadata"] = {
      primaryTokens: [],
      abbreviations: [],
      synonyms: [],
      caseVariations: [],
    };

    // Apply builders in priority order
    for (const builder of this.builders) {
      if (builder.canHandle(context)) {
        const result = builder.generateTokens(context);

        // Combine tokens
        result.tokens.forEach(token => allTokens.add(token));

        // Combine metadata
        if (result.metadata) {
          if (result.metadata.primaryTokens) {
            combinedMetadata.primaryTokens!.push(
              ...result.metadata.primaryTokens
            );
          }
          if (result.metadata.abbreviations) {
            combinedMetadata.abbreviations!.push(
              ...result.metadata.abbreviations
            );
          }
          if (result.metadata.synonyms) {
            combinedMetadata.synonyms!.push(...result.metadata.synonyms);
          }
          if (result.metadata.caseVariations) {
            combinedMetadata.caseVariations!.push(
              ...result.metadata.caseVariations
            );
          }
        }
      }
    }

    return {
      tokens: allTokens,
      metadata: combinedMetadata,
    };
  }

  /**
   * Get all registered builders
   */
  getBuilders(): ITokenBuilder[] {
    return [...this.builders];
  }

  /**
   * Clear all registered builders
   */
  clear(): void {
    this.builders = [];
  }
}

/**
 * Default registry instance
 */
export const defaultTokenRegistry = new TokenBuilderRegistry();
