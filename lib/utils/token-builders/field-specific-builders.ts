/**
 * Field-specific token builders for different data types
 */

import type { FieldType } from "@/lib/types/target-shapes";
import { BaseTokenBuilder, type TokenContext, type TokenResult } from "./base-token-builder";

/**
 * Token builder for email fields
 */
export class EmailTokenBuilder extends BaseTokenBuilder {
  priority = 80;
  supportedTypes: FieldType[] = ["email"];
  
  canHandle(context: TokenContext): boolean {
    return super.canHandle(context) || 
           this.containsKeywords(context.fieldName, ["email", "mail"]) ||
           this.containsKeywords(context.fieldId, ["email", "mail"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    
    // Primary email tokens
    const primaryTokens = ["email", "mail", "e_mail", "email_address", "emailaddress"];
    primaryTokens.forEach(token => tokens.add(token));
    
    // Add case variations of primary tokens
    primaryTokens.forEach(token => {
      this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
    });
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["mail"],
        synonyms: ["e_mail", "electronic_mail"],
      }
    };
  }
}

/**
 * Token builder for phone fields
 */
export class PhoneTokenBuilder extends BaseTokenBuilder {
  priority = 80;
  supportedTypes: FieldType[] = ["phone"];
  
  canHandle(context: TokenContext): boolean {
    return super.canHandle(context) || 
           this.containsKeywords(context.fieldName, ["phone", "tel", "mobile", "cell"]) ||
           this.containsKeywords(context.fieldId, ["phone", "tel", "mobile", "cell"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    
    // Primary phone tokens
    const primaryTokens = ["phone", "tel", "telephone", "mobile", "cell", "phone_number", "phonenumber"];
    primaryTokens.forEach(token => tokens.add(token));
    
    // Add case variations
    primaryTokens.forEach(token => {
      this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
    });
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["tel", "mob"],
        synonyms: ["telephone", "mobile", "cell", "cellular"],
      }
    };
  }
}

/**
 * Token builder for name fields
 */
export class NameTokenBuilder extends BaseTokenBuilder {
  priority = 70;
  supportedTypes: FieldType[] = ["string"];
  
  canHandle(context: TokenContext): boolean {
    return this.containsKeywords(context.fieldName, ["name"]) ||
           this.containsKeywords(context.fieldId, ["name"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    const primaryTokens: string[] = [];
    const abbreviations: string[] = [];
    
    // General name tokens
    tokens.add("name");
    primaryTokens.push("name");
    
    // First name variations
    if (this.containsKeywords(context.fieldName, ["first"]) || 
        this.containsKeywords(context.fieldId, ["first"])) {
      const firstNameTokens = ["firstname", "first_name", "fname", "first", "given_name", "givenname"];
      firstNameTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...firstNameTokens);
      abbreviations.push("fname");
    }
    
    // Last name variations
    if (this.containsKeywords(context.fieldName, ["last", "sur"]) || 
        this.containsKeywords(context.fieldId, ["last", "sur"])) {
      const lastNameTokens = ["lastname", "last_name", "lname", "last", "surname", "family_name", "familyname"];
      lastNameTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...lastNameTokens);
      abbreviations.push("lname");
    }
    
    // Full name variations
    if (this.containsKeywords(context.fieldName, ["full"]) || 
        this.containsKeywords(context.fieldId, ["full"])) {
      const fullNameTokens = ["fullname", "full_name", "display_name", "displayname", "complete_name"];
      fullNameTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...fullNameTokens);
    }
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations,
        synonyms: ["given_name", "family_name", "surname"],
      }
    };
  }
}

/**
 * Token builder for ID fields
 */
export class IdTokenBuilder extends BaseTokenBuilder {
  priority = 75;
  supportedTypes: FieldType[] = ["string", "integer"];
  
  canHandle(context: TokenContext): boolean {
    return this.containsKeywords(context.fieldName, ["id"]) ||
           this.containsKeywords(context.fieldId, ["id"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    
    // Primary ID tokens
    const primaryTokens = ["id", "identifier", "key", "primary_key", "pk"];
    primaryTokens.forEach(token => {
      tokens.add(token);
      this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
    });
    
    // Context-specific ID tokens
    const fieldLower = context.fieldName.toLowerCase();
    const fieldIdLower = context.fieldId.toLowerCase();
    
    // User ID variations
    if (fieldLower.includes("user") || fieldIdLower.includes("user")) {
      const userTokens = ["user_id", "userid", "uid", "user_key"];
      userTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
    }
    
    // Customer ID variations
    if (fieldLower.includes("customer") || fieldIdLower.includes("customer") ||
        fieldLower.includes("cust") || fieldIdLower.includes("cust")) {
      const customerTokens = ["customer_id", "customerid", "cust_id", "custid", "customer_key"];
      customerTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
    }
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["id", "pk", "uid"],
        synonyms: ["identifier", "key", "primary_key"],
      }
    };
  }
}

/**
 * Token builder for date/time fields
 */
export class DateTimeTokenBuilder extends BaseTokenBuilder {
  priority = 70;
  supportedTypes: FieldType[] = ["date", "datetime"];
  
  canHandle(context: TokenContext): boolean {
    return super.canHandle(context) ||
           this.containsKeywords(context.fieldName, ["date", "time", "created", "updated", "modified"]) ||
           this.containsKeywords(context.fieldId, ["date", "time", "created", "updated", "modified"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    const primaryTokens: string[] = [];
    
    // General date/time tokens
    const generalTokens = ["date", "time", "datetime", "timestamp"];
    generalTokens.forEach(token => {
      tokens.add(token);
      this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
    });
    primaryTokens.push(...generalTokens);
    
    // Specific date patterns
    if (this.containsKeywords(context.fieldName, ["created"]) || 
        this.containsKeywords(context.fieldId, ["created"])) {
      const createdTokens = ["created", "created_at", "createdat", "creation_date", "creationdate"];
      createdTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...createdTokens);
    }
    
    if (this.containsKeywords(context.fieldName, ["updated", "modified"]) || 
        this.containsKeywords(context.fieldId, ["updated", "modified"])) {
      const updatedTokens = ["updated", "updated_at", "updatedat", "modified", "modified_at", "modifiedat"];
      updatedTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...updatedTokens);
    }
    
    // Birth date variations
    if (this.containsKeywords(context.fieldName, ["birth", "born"]) || 
        this.containsKeywords(context.fieldId, ["birth", "born"])) {
      const birthTokens = ["birthdate", "birth_date", "dob", "date_of_birth", "born"];
      birthTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...birthTokens);
    }
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["dob", "ts"],
        synonyms: ["timestamp", "datetime"],
      }
    };
  }
}

/**
 * Token builder for numeric fields
 */
export class NumericTokenBuilder extends BaseTokenBuilder {
  priority = 60;
  supportedTypes: FieldType[] = ["number", "integer", "decimal", "currency", "percentage"];
  
  canHandle(context: TokenContext): boolean {
    return super.canHandle(context) ||
           this.containsKeywords(context.fieldName, ["age", "count", "total", "amount", "price", "cost", "salary", "wage"]) ||
           this.containsKeywords(context.fieldId, ["age", "count", "total", "amount", "price", "cost", "salary", "wage"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    const primaryTokens: string[] = [];
    
    // Age variations
    if (this.containsKeywords(context.fieldName, ["age"]) || 
        this.containsKeywords(context.fieldId, ["age"])) {
      const ageTokens = ["age", "years", "years_old", "yearsold"];
      ageTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...ageTokens);
    }
    
    // Currency/Money variations
    if (this.containsKeywords(context.fieldName, ["price", "cost", "salary", "wage", "amount", "money"]) || 
        this.containsKeywords(context.fieldId, ["price", "cost", "salary", "wage", "amount", "money"])) {
      const moneyTokens = ["price", "cost", "salary", "wage", "amount", "money", "payment", "fee"];
      moneyTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...moneyTokens);
    }
    
    // Count variations
    if (this.containsKeywords(context.fieldName, ["count", "total", "number"]) || 
        this.containsKeywords(context.fieldId, ["count", "total", "number"])) {
      const countTokens = ["count", "total", "number", "qty", "quantity"];
      countTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...countTokens);
    }
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["qty", "amt", "num"],
        synonyms: ["quantity", "amount", "number"],
      }
    };
  }
}

/**
 * Token builder for address fields
 */
export class AddressTokenBuilder extends BaseTokenBuilder {
  priority = 70;
  supportedTypes: FieldType[] = ["string"];
  
  canHandle(context: TokenContext): boolean {
    return this.containsKeywords(context.fieldName, ["address", "street", "city", "state", "zip", "postal", "country"]) ||
           this.containsKeywords(context.fieldId, ["address", "street", "city", "state", "zip", "postal", "country"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    const primaryTokens: string[] = [];
    
    // Address variations
    if (this.containsKeywords(context.fieldName, ["address"]) || 
        this.containsKeywords(context.fieldId, ["address"])) {
      const addressTokens = ["address", "addr", "street_address", "streetaddress"];
      addressTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...addressTokens);
    }
    
    // Street variations
    if (this.containsKeywords(context.fieldName, ["street"]) || 
        this.containsKeywords(context.fieldId, ["street"])) {
      const streetTokens = ["street", "st", "road", "rd", "avenue", "ave"];
      streetTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...streetTokens);
    }
    
    // City variations
    if (this.containsKeywords(context.fieldName, ["city"]) || 
        this.containsKeywords(context.fieldId, ["city"])) {
      const cityTokens = ["city", "town", "municipality"];
      cityTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...cityTokens);
    }
    
    // State/Province variations
    if (this.containsKeywords(context.fieldName, ["state", "province"]) || 
        this.containsKeywords(context.fieldId, ["state", "province"])) {
      const stateTokens = ["state", "province", "region"];
      stateTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...stateTokens);
    }
    
    // ZIP/Postal code variations
    if (this.containsKeywords(context.fieldName, ["zip", "postal"]) || 
        this.containsKeywords(context.fieldId, ["zip", "postal"])) {
      const zipTokens = ["zip", "zipcode", "zip_code", "postal", "postal_code", "postalcode"];
      zipTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...zipTokens);
    }
    
    // Country variations
    if (this.containsKeywords(context.fieldName, ["country"]) || 
        this.containsKeywords(context.fieldId, ["country"])) {
      const countryTokens = ["country", "nation", "country_code", "countrycode"];
      countryTokens.forEach(token => {
        tokens.add(token);
        this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
      });
      primaryTokens.push(...countryTokens);
    }
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["addr", "st", "rd", "ave", "zip"],
        synonyms: ["street", "road", "avenue", "town", "municipality", "province", "region"],
      }
    };
  }
}

/**
 * Token builder for URL fields
 */
export class UrlTokenBuilder extends BaseTokenBuilder {
  priority = 80;
  supportedTypes: FieldType[] = ["url"];
  
  canHandle(context: TokenContext): boolean {
    return super.canHandle(context) ||
           this.containsKeywords(context.fieldName, ["url", "link", "website", "site"]) ||
           this.containsKeywords(context.fieldId, ["url", "link", "website", "site"]);
  }
  
  generateTokens(context: TokenContext): TokenResult {
    const tokens = new Set<string>();
    
    // URL tokens
    const primaryTokens = ["url", "link", "website", "site", "web_address", "webaddress", "homepage"];
    primaryTokens.forEach(token => {
      tokens.add(token);
      this.generateCaseVariations(token).forEach(variation => tokens.add(variation));
    });
    
    return {
      tokens,
      metadata: {
        primaryTokens,
        abbreviations: ["url", "link"],
        synonyms: ["website", "web_address", "homepage"],
      }
    };
  }
}