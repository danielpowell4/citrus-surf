import { describe, it, expect, beforeEach } from "vitest";
import {
  BaseTokenBuilder,
  GenericTokenBuilder,
  TokenBuilderRegistry,
  TokenBuilderRegistry,
  type TokenContext,
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

import {
  generateFieldVariations,
  generateColumnVariations,
  generateFieldVariationsWithMetadata,
  addCustomTokenBuilder,
  getRegisteredBuilders,
  resetTokenRegistry,
} from "./index";

describe("Token Builder System", () => {
  describe("BaseTokenBuilder", () => {
    class TestTokenBuilder extends BaseTokenBuilder {
      priority = 50;
      supportedTypes = ["string"];

      generateTokens(_context: TokenContext) {
        const tokens = new Set<string>();
        tokens.add("test_token");
        return { tokens };
      }
    }

    it("should have utility methods for case conversion", () => {
      const builder = new TestTokenBuilder();

      expect(builder["toSnakeCase"]("firstName")).toBe("first_name");
      expect(builder["toCamelCase"]("first_name")).toBe("firstName");
    });

    it("should generate case variations", () => {
      const builder = new TestTokenBuilder();
      const variations = builder["generateCaseVariations"]("First Name");

      expect(variations.has("first name")).toBe(true);
      expect(variations.has("first_name")).toBe(true);
      expect(variations.has("firstName")).toBe(true);
    });

    it("should clean field names", () => {
      const builder = new TestTokenBuilder();

      expect(builder["cleanFieldName"]("field_name")).toBe("name");
      expect(builder["cleanFieldName"]("col_email")).toBe("email");
      expect(builder["cleanFieldName"]("name_field")).toBe("name");
    });

    it("should check for keywords", () => {
      const builder = new TestTokenBuilder();

      expect(builder["containsKeywords"]("user_email", ["email"])).toBe(true);
      expect(builder["containsKeywords"]("firstName", ["name"])).toBe(true);
      expect(builder["containsKeywords"]("age", ["email"])).toBe(false);
    });

    it("should check if it can handle a context", () => {
      const builder = new TestTokenBuilder();

      expect(
        builder.canHandle({
          fieldName: "name",
          fieldId: "field_name",
          fieldType: "string",
        })
      ).toBe(true);
      expect(
        builder.canHandle({
          fieldName: "age",
          fieldId: "field_age",
          fieldType: "integer",
        })
      ).toBe(false);
    });
  });

  describe("GenericTokenBuilder", () => {
    let builder: GenericTokenBuilder;

    beforeEach(() => {
      builder = new GenericTokenBuilder();
    });

    it("should generate basic tokens", () => {
      const result = builder.generateTokens({
        fieldName: "First Name",
        fieldId: "field_firstName",
      });

      expect(result.tokens.has("first name")).toBe(true);
      expect(result.tokens.has("field_firstname")).toBe(true);
      expect(result.tokens.has("first_name")).toBe(true);
      expect(result.tokens.has("firstName")).toBe(true);
    });

    it("should handle cleaned field names", () => {
      const result = builder.generateTokens({
        fieldName: "User Name",
        fieldId: "field_user_name",
      });

      expect(result.tokens.has("user_name")).toBe(true);
      expect(result.tokens.has("userName")).toBe(true);
    });
  });

  describe("EmailTokenBuilder", () => {
    let builder: EmailTokenBuilder;

    beforeEach(() => {
      builder = new EmailTokenBuilder();
    });

    it("should handle email field types", () => {
      expect(
        builder.canHandle({
          fieldName: "email",
          fieldId: "field_email",
          fieldType: "email",
        })
      ).toBe(true);
    });

    it("should handle email-related field names", () => {
      expect(
        builder.canHandle({
          fieldName: "Email Address",
          fieldId: "field_email",
        })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "user_mail", fieldId: "field_mail" })
      ).toBe(true);
    });

    it("should generate email tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Email Address",
        fieldId: "field_email",
      });

      expect(result.tokens.has("email")).toBe(true);
      expect(result.tokens.has("mail")).toBe(true);
      expect(result.tokens.has("e_mail")).toBe(true);
      expect(result.tokens.has("email_address")).toBe(true);
      expect(result.tokens.has("emailAddress")).toBe(true);
    });

    it("should include metadata", () => {
      const result = builder.generateTokens({
        fieldName: "Email",
        fieldId: "field_email",
      });

      expect(result.metadata?.abbreviations).toContain("mail");
      expect(result.metadata?.synonyms).toContain("e_mail");
    });
  });

  describe("PhoneTokenBuilder", () => {
    let builder: PhoneTokenBuilder;

    beforeEach(() => {
      builder = new PhoneTokenBuilder();
    });

    it("should handle phone field types", () => {
      expect(
        builder.canHandle({
          fieldName: "phone",
          fieldId: "field_phone",
          fieldType: "phone",
        })
      ).toBe(true);
    });

    it("should handle phone-related field names", () => {
      expect(
        builder.canHandle({ fieldName: "Phone Number", fieldId: "field_phone" })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "mobile", fieldId: "field_mobile" })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "telephone", fieldId: "field_tel" })
      ).toBe(true);
    });

    it("should generate phone tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Phone Number",
        fieldId: "field_phone",
      });

      expect(result.tokens.has("phone")).toBe(true);
      expect(result.tokens.has("tel")).toBe(true);
      expect(result.tokens.has("telephone")).toBe(true);
      expect(result.tokens.has("mobile")).toBe(true);
      expect(result.tokens.has("cell")).toBe(true);
    });
  });

  describe("NameTokenBuilder", () => {
    let builder: NameTokenBuilder;

    beforeEach(() => {
      builder = new NameTokenBuilder();
    });

    it("should handle name-related fields", () => {
      expect(
        builder.canHandle({ fieldName: "First Name", fieldId: "field_name" })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "user_name", fieldId: "field_username" })
      ).toBe(true);
    });

    it("should generate first name tokens", () => {
      const result = builder.generateTokens({
        fieldName: "First Name",
        fieldId: "field_firstName",
      });

      expect(result.tokens.has("firstname")).toBe(true);
      expect(result.tokens.has("first_name")).toBe(true);
      expect(result.tokens.has("fname")).toBe(true);
      expect(result.tokens.has("first")).toBe(true);
      expect(result.tokens.has("given_name")).toBe(true);
    });

    it("should generate last name tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Last Name",
        fieldId: "field_lastName",
      });

      expect(result.tokens.has("lastname")).toBe(true);
      expect(result.tokens.has("last_name")).toBe(true);
      expect(result.tokens.has("lname")).toBe(true);
      expect(result.tokens.has("last")).toBe(true);
      expect(result.tokens.has("surname")).toBe(true);
      expect(result.tokens.has("family_name")).toBe(true);
    });

    it("should generate full name tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Full Name",
        fieldId: "field_fullName",
      });

      expect(result.tokens.has("fullname")).toBe(true);
      expect(result.tokens.has("full_name")).toBe(true);
      expect(result.tokens.has("display_name")).toBe(true);
      expect(result.tokens.has("complete_name")).toBe(true);
    });
  });

  describe("IdTokenBuilder", () => {
    let builder: IdTokenBuilder;

    beforeEach(() => {
      builder = new IdTokenBuilder();
    });

    it("should handle ID-related fields", () => {
      expect(
        builder.canHandle({ fieldName: "User ID", fieldId: "field_id" })
      ).toBe(true);
      expect(
        builder.canHandle({
          fieldName: "identifier",
          fieldId: "field_identifier",
        })
      ).toBe(true);
    });

    it("should generate basic ID tokens", () => {
      const result = builder.generateTokens({
        fieldName: "ID",
        fieldId: "field_id",
      });

      expect(result.tokens.has("id")).toBe(true);
      expect(result.tokens.has("identifier")).toBe(true);
      expect(result.tokens.has("key")).toBe(true);
      expect(result.tokens.has("primary_key")).toBe(true);
      expect(result.tokens.has("pk")).toBe(true);
    });

    it("should generate user ID tokens", () => {
      const result = builder.generateTokens({
        fieldName: "User ID",
        fieldId: "field_user_id",
      });

      expect(result.tokens.has("user_id")).toBe(true);
      expect(result.tokens.has("userid")).toBe(true);
      expect(result.tokens.has("uid")).toBe(true);
      expect(result.tokens.has("user_key")).toBe(true);
    });

    it("should generate customer ID tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Customer ID",
        fieldId: "field_customer_id",
      });

      expect(result.tokens.has("customer_id")).toBe(true);
      expect(result.tokens.has("customerid")).toBe(true);
      expect(result.tokens.has("cust_id")).toBe(true);
      expect(result.tokens.has("custid")).toBe(true);
    });
  });

  describe("DateTimeTokenBuilder", () => {
    let builder: DateTimeTokenBuilder;

    beforeEach(() => {
      builder = new DateTimeTokenBuilder();
    });

    it("should handle date/time field types", () => {
      expect(
        builder.canHandle({
          fieldName: "created",
          fieldId: "field_date",
          fieldType: "date",
        })
      ).toBe(true);
      expect(
        builder.canHandle({
          fieldName: "timestamp",
          fieldId: "field_time",
          fieldType: "datetime",
        })
      ).toBe(true);
    });

    it("should handle date-related field names", () => {
      expect(
        builder.canHandle({
          fieldName: "Created Date",
          fieldId: "field_created",
        })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "updated_at", fieldId: "field_updated" })
      ).toBe(true);
    });

    it("should generate general date tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Date",
        fieldId: "field_date",
      });

      expect(result.tokens.has("date")).toBe(true);
      expect(result.tokens.has("time")).toBe(true);
      expect(result.tokens.has("datetime")).toBe(true);
      expect(result.tokens.has("timestamp")).toBe(true);
    });

    it("should generate created date tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Created At",
        fieldId: "field_created",
      });

      expect(result.tokens.has("created")).toBe(true);
      expect(result.tokens.has("created_at")).toBe(true);
      expect(result.tokens.has("createdat")).toBe(true);
      expect(result.tokens.has("creation_date")).toBe(true);
    });

    it("should generate birth date tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Birth Date",
        fieldId: "field_birth",
      });

      expect(result.tokens.has("birthdate")).toBe(true);
      expect(result.tokens.has("birth_date")).toBe(true);
      expect(result.tokens.has("dob")).toBe(true);
      expect(result.tokens.has("date_of_birth")).toBe(true);
      expect(result.tokens.has("born")).toBe(true);
    });
  });

  describe("NumericTokenBuilder", () => {
    let builder: NumericTokenBuilder;

    beforeEach(() => {
      builder = new NumericTokenBuilder();
    });

    it("should handle numeric field types", () => {
      expect(
        builder.canHandle({
          fieldName: "amount",
          fieldId: "field_amount",
          fieldType: "number",
        })
      ).toBe(true);
      expect(
        builder.canHandle({
          fieldName: "count",
          fieldId: "field_count",
          fieldType: "integer",
        })
      ).toBe(true);
      expect(
        builder.canHandle({
          fieldName: "price",
          fieldId: "field_price",
          fieldType: "currency",
        })
      ).toBe(true);
    });

    it("should generate age tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Age",
        fieldId: "field_age",
      });

      expect(result.tokens.has("age")).toBe(true);
      expect(result.tokens.has("years")).toBe(true);
      expect(result.tokens.has("years_old")).toBe(true);
      expect(result.tokens.has("yearsold")).toBe(true);
    });

    it("should generate currency tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Salary",
        fieldId: "field_salary",
      });

      expect(result.tokens.has("salary")).toBe(true);
      expect(result.tokens.has("wage")).toBe(true);
      expect(result.tokens.has("amount")).toBe(true);
      expect(result.tokens.has("money")).toBe(true);
      expect(result.tokens.has("payment")).toBe(true);
    });

    it("should generate count tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Total Count",
        fieldId: "field_count",
      });

      expect(result.tokens.has("count")).toBe(true);
      expect(result.tokens.has("total")).toBe(true);
      expect(result.tokens.has("number")).toBe(true);
      expect(result.tokens.has("qty")).toBe(true);
      expect(result.tokens.has("quantity")).toBe(true);
    });
  });

  describe("AddressTokenBuilder", () => {
    let builder: AddressTokenBuilder;

    beforeEach(() => {
      builder = new AddressTokenBuilder();
    });

    it("should handle address-related fields", () => {
      expect(
        builder.canHandle({
          fieldName: "Street Address",
          fieldId: "field_address",
        })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "zip_code", fieldId: "field_zip" })
      ).toBe(true);
    });

    it("should generate address tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Address",
        fieldId: "field_address",
      });

      expect(result.tokens.has("address")).toBe(true);
      expect(result.tokens.has("addr")).toBe(true);
      expect(result.tokens.has("street_address")).toBe(true);
      expect(result.tokens.has("streetaddress")).toBe(true);
    });

    it("should generate street tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Street",
        fieldId: "field_street",
      });

      expect(result.tokens.has("street")).toBe(true);
      expect(result.tokens.has("st")).toBe(true);
      expect(result.tokens.has("road")).toBe(true);
      expect(result.tokens.has("rd")).toBe(true);
      expect(result.tokens.has("avenue")).toBe(true);
      expect(result.tokens.has("ave")).toBe(true);
    });

    it("should generate ZIP code tokens", () => {
      const result = builder.generateTokens({
        fieldName: "ZIP Code",
        fieldId: "field_zip",
      });

      expect(result.tokens.has("zip")).toBe(true);
      expect(result.tokens.has("zipcode")).toBe(true);
      expect(result.tokens.has("zip_code")).toBe(true);
      expect(result.tokens.has("postal")).toBe(true);
      expect(result.tokens.has("postal_code")).toBe(true);
    });
  });

  describe("UrlTokenBuilder", () => {
    let builder: UrlTokenBuilder;

    beforeEach(() => {
      builder = new UrlTokenBuilder();
    });

    it("should handle URL field types", () => {
      expect(
        builder.canHandle({
          fieldName: "website",
          fieldId: "field_url",
          fieldType: "url",
        })
      ).toBe(true);
    });

    it("should handle URL-related field names", () => {
      expect(
        builder.canHandle({ fieldName: "Website", fieldId: "field_website" })
      ).toBe(true);
      expect(
        builder.canHandle({ fieldName: "homepage", fieldId: "field_link" })
      ).toBe(true);
    });

    it("should generate URL tokens", () => {
      const result = builder.generateTokens({
        fieldName: "Website",
        fieldId: "field_url",
      });

      expect(result.tokens.has("url")).toBe(true);
      expect(result.tokens.has("link")).toBe(true);
      expect(result.tokens.has("website")).toBe(true);
      expect(result.tokens.has("site")).toBe(true);
      expect(result.tokens.has("web_address")).toBe(true);
      expect(result.tokens.has("homepage")).toBe(true);
    });
  });

  describe("TokenBuilderRegistry", () => {
    let registry: TokenBuilderRegistry;

    beforeEach(() => {
      registry = new TokenBuilderRegistry();
    });

    it("should register builders and sort by priority", () => {
      const lowPriorityBuilder = new GenericTokenBuilder(); // priority = 0
      const highPriorityBuilder = new EmailTokenBuilder(); // priority = 80

      registry.register(lowPriorityBuilder);
      registry.register(highPriorityBuilder);

      const builders = registry.getBuilders();
      expect(builders[0]).toBe(highPriorityBuilder);
      expect(builders[1]).toBe(lowPriorityBuilder);
    });

    it("should generate tokens using applicable builders", () => {
      registry.register(new EmailTokenBuilder());
      registry.register(new GenericTokenBuilder());

      const result = registry.generateTokens({
        fieldName: "Email Address",
        fieldId: "field_email",
        fieldType: "email",
      });

      expect(result.tokens.has("email")).toBe(true);
      expect(result.tokens.has("mail")).toBe(true);
      expect(result.tokens.has("email_address")).toBe(true);
    });

    it("should combine metadata from multiple builders", () => {
      registry.register(new EmailTokenBuilder());
      registry.register(new GenericTokenBuilder());

      const result = registry.generateTokens({
        fieldName: "Email",
        fieldId: "field_email",
        fieldType: "email",
      });

      expect(result.metadata?.abbreviations?.length).toBeGreaterThan(0);
      expect(result.metadata?.synonyms?.length).toBeGreaterThan(0);
    });

    it("should clear all builders", () => {
      registry.register(new EmailTokenBuilder());
      expect(registry.getBuilders()).toHaveLength(1);

      registry.clear();
      expect(registry.getBuilders()).toHaveLength(0);
    });
  });

  describe("Main Interface Functions", () => {
    beforeEach(() => {
      resetTokenRegistry();
    });

    it("should generate field variations", () => {
      const variations = generateFieldVariations(
        "Email Address",
        "field_email",
        "email"
      );

      expect(variations.has("email")).toBe(true);
      expect(variations.has("mail")).toBe(true);
      expect(variations.has("email_address")).toBe(true);
      expect(variations.size).toBeGreaterThan(5);
    });

    it("should generate column variations", () => {
      const variations = generateColumnVariations("user_email");

      expect(variations.has("user_email")).toBe(true);
      expect(variations.has("userEmail")).toBe(true);
      expect(variations.size).toBeGreaterThan(1);
    });

    it("should generate field variations with metadata", () => {
      const result = generateFieldVariationsWithMetadata(
        "Phone Number",
        "field_phone",
        "phone"
      );

      expect(result.tokens.has("phone")).toBe(true);
      expect(result.tokens.has("tel")).toBe(true);
      expect(result.metadata?.abbreviations).toContain("tel");
    });

    it("should allow adding custom token builders", () => {
      class CustomBuilder extends BaseTokenBuilder {
        priority = 90;
        supportedTypes = ["custom"];

        generateTokens() {
          return { tokens: new Set(["custom_token"]) };
        }
      }

      addCustomTokenBuilder(new CustomBuilder());
      const builders = getRegisteredBuilders();

      expect(builders.some(b => b instanceof CustomBuilder)).toBe(true);
    });

    it("should reset token registry to default", () => {
      // Add a custom builder
      class CustomBuilder extends BaseTokenBuilder {
        priority = 90;
        supportedTypes = ["custom"];
        generateTokens() {
          return { tokens: new Set(["custom_token"]) };
        }
      }

      addCustomTokenBuilder(new CustomBuilder());
      expect(
        getRegisteredBuilders().some(b => b instanceof CustomBuilder)
      ).toBe(true);

      // Reset and check it's gone
      resetTokenRegistry();
      expect(
        getRegisteredBuilders().some(b => b instanceof CustomBuilder)
      ).toBe(false);

      // But default builders should still be there
      expect(
        getRegisteredBuilders().some(b => b instanceof EmailTokenBuilder)
      ).toBe(true);
    });
  });
});
