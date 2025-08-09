import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateReferenceDataUrl,
  generateLookupConfigUrl,
  generateFuzzyMatchReviewUrl,
  parseReferenceDataParams,
  parseLookupConfigParams,
  parseFuzzyMatchReviewParams,
  LookupNavigator,
  createLookupNavigator,
  isValidReferenceId,
  isValidBatchId,
  isValidFuzzyMatchId,
  generateLookupBreadcrumbs,
  isLookupRoute,
  getSuggestedNextActions,
} from "./lookup-navigation";

describe("Lookup Navigation Utilities", () => {
  describe("URL Generation", () => {
    it("generates reference data URLs without parameters", () => {
      const url = generateReferenceDataUrl();
      expect(url).toBe("/playground/reference-data");
    });

    it("generates reference data URLs with file parameter", () => {
      const url = generateReferenceDataUrl({ file: "ref_123" });
      expect(url).toBe("/playground/reference-data?file=ref_123");
    });

    it("generates reference data URLs with file and mode parameters", () => {
      const url = generateReferenceDataUrl({ file: "ref_123", mode: "edit" });
      expect(url).toBe("/playground/reference-data?file=ref_123&mode=edit");
    });

    it("generates lookup config URLs without parameters", () => {
      const url = generateLookupConfigUrl();
      expect(url).toBe("/playground/template-builder");
    });

    it("generates lookup config URLs with field and action parameters", () => {
      const url = generateLookupConfigUrl({
        field: "field_123",
        action: "configure-lookup",
      });
      expect(url).toBe(
        "/playground/template-builder?field=field_123&action=configure-lookup"
      );
    });

    it("generates fuzzy match review URLs with parameters", () => {
      const url = generateFuzzyMatchReviewUrl({
        review: "fuzzy-matches",
        batch: "batch_123",
      });
      expect(url).toBe(
        "/playground/data-table?review=fuzzy-matches&batch=batch_123"
      );
    });
  });

  describe("URL Parsing", () => {
    it("parses reference data parameters from URLSearchParams", () => {
      const searchParams = new URLSearchParams("file=ref_123&mode=edit");
      const params = parseReferenceDataParams(searchParams);

      expect(params).toEqual({
        file: "ref_123",
        mode: "edit",
      });
    });

    it("parses lookup config parameters from URLSearchParams", () => {
      const searchParams = new URLSearchParams(
        "field=field_123&action=configure-lookup"
      );
      const params = parseLookupConfigParams(searchParams);

      expect(params).toEqual({
        field: "field_123",
        action: "configure-lookup",
      });
    });

    it("parses fuzzy match review parameters from URLSearchParams", () => {
      const searchParams = new URLSearchParams(
        "review=fuzzy-matches&batch=batch_123"
      );
      const params = parseFuzzyMatchReviewParams(searchParams);

      expect(params).toEqual({
        review: "fuzzy-matches",
        batch: "batch_123",
      });
    });

    it("handles empty search params gracefully", () => {
      const searchParams = new URLSearchParams("");

      expect(parseReferenceDataParams(searchParams)).toEqual({});
      expect(parseLookupConfigParams(searchParams)).toEqual({});
      expect(parseFuzzyMatchReviewParams(searchParams)).toEqual({});
    });

    it("ignores invalid mode values", () => {
      const searchParams = new URLSearchParams("file=ref_123&mode=invalid");
      const params = parseReferenceDataParams(searchParams);

      expect(params).toEqual({
        file: "ref_123",
      });
    });
  });

  describe("LookupNavigator", () => {
    let mockRouter: any;
    let navigator: LookupNavigator;

    beforeEach(() => {
      mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      };

      navigator = createLookupNavigator(
        mockRouter,
        "/playground/reference-data",
        new URLSearchParams("")
      );
    });

    it("navigates to reference data viewer", () => {
      navigator.toReferenceDataViewer("ref_123");

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/reference-data?file=ref_123&mode=view"
      );
    });

    it("navigates to reference data editor", () => {
      navigator.toReferenceDataEditor("ref_123");

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/reference-data?file=ref_123&mode=edit"
      );
    });

    it("navigates to lookup configuration", () => {
      navigator.toLookupConfiguration("field_123");

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/template-builder?field=field_123&action=configure-lookup"
      );
    });

    it("navigates to fuzzy match review", () => {
      navigator.toFuzzyMatchReview("batch_123");

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/data-table?review=fuzzy-matches&batch=batch_123"
      );
    });

    it("uses replace when specified", () => {
      navigator.toReferenceDataViewer("ref_123", { replace: true });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/playground/reference-data?file=ref_123&mode=view"
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("navigates to data table with results", () => {
      navigator.toDataTableWithResults();

      expect(mockRouter.push).toHaveBeenCalledWith("/playground/data-table");
    });

    it("navigates to template builder", () => {
      navigator.toTemplateBuilder();

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/template-builder"
      );
    });

    it("navigates to reference data management", () => {
      navigator.toReferenceDataManagement();

      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/reference-data"
      );
    });
  });

  describe("ID Validation", () => {
    it("validates reference IDs", () => {
      expect(isValidReferenceId("ref_01H9X2K3L4M5N6P7Q8R9S0T1U2")).toBe(true);
      expect(isValidReferenceId("invalid_id")).toBe(false);
      expect(isValidReferenceId("batch_01H9X2K3L4M5N6P7Q8R9S0T1U2")).toBe(
        false
      );
    });

    it("validates batch IDs", () => {
      expect(isValidBatchId("batch_01H9X2K3L4M5N6P7Q8R9S0T1U2")).toBe(true);
      expect(isValidBatchId("invalid_id")).toBe(false);
      expect(isValidBatchId("ref_01H9X2K3L4M5N6P7Q8R9S0T1U2")).toBe(false);
    });

    it("validates fuzzy match IDs", () => {
      expect(isValidFuzzyMatchId("match_01H9X2K3L4M5N6P7Q8R9S0T1U")).toBe(true);
      expect(isValidFuzzyMatchId("invalid_id")).toBe(false);
      expect(isValidFuzzyMatchId("ref_01H9X2K3L4M5N6P7Q8R9S0T1U2")).toBe(false);
    });
  });

  describe("Breadcrumb Generation", () => {
    it("generates breadcrumbs for reference data root", () => {
      const breadcrumbs = generateLookupBreadcrumbs(
        "/playground/reference-data",
        new URLSearchParams("")
      );

      expect(breadcrumbs).toEqual([
        { label: "Playground", href: "/playground" },
        {
          label: "Reference Data",
          href: "/playground/reference-data",
          current: true,
        },
      ]);
    });

    it("generates breadcrumbs for reference data viewer", () => {
      const searchParams = new URLSearchParams("file=ref_123&mode=view");
      const breadcrumbs = generateLookupBreadcrumbs(
        "/playground/reference-data",
        searchParams
      );

      expect(breadcrumbs).toEqual([
        { label: "Playground", href: "/playground" },
        { label: "Reference Data", href: "/playground/reference-data" },
        {
          label: "View File",
          href: "/playground/reference-data?file=ref_123&mode=view",
          current: true,
        },
      ]);
    });

    it("generates breadcrumbs for reference data editor", () => {
      const searchParams = new URLSearchParams("file=ref_123&mode=edit");
      const breadcrumbs = generateLookupBreadcrumbs(
        "/playground/reference-data",
        searchParams
      );

      expect(breadcrumbs).toEqual([
        { label: "Playground", href: "/playground" },
        { label: "Reference Data", href: "/playground/reference-data" },
        {
          label: "Edit File",
          href: "/playground/reference-data?file=ref_123&mode=edit",
          current: true,
        },
      ]);
    });

    it("generates breadcrumbs for template builder with lookup config", () => {
      const searchParams = new URLSearchParams(
        "field=field_123&action=configure-lookup"
      );
      const breadcrumbs = generateLookupBreadcrumbs(
        "/playground/template-builder",
        searchParams
      );

      expect(breadcrumbs).toEqual([
        { label: "Playground", href: "/playground" },
        { label: "Template Builder", href: "/playground/template-builder" },
        {
          label: "Configure Lookup",
          href: "/playground/template-builder?field=field_123&action=configure-lookup",
          current: true,
        },
      ]);
    });

    it("generates breadcrumbs for fuzzy match review", () => {
      const searchParams = new URLSearchParams(
        "review=fuzzy-matches&batch=batch_123"
      );
      const breadcrumbs = generateLookupBreadcrumbs(
        "/playground/data-table",
        searchParams
      );

      expect(breadcrumbs).toEqual([
        { label: "Playground", href: "/playground" },
        { label: "Data Table", href: "/playground/data-table" },
        {
          label: "Review Fuzzy Matches",
          href: "/playground/data-table?review=fuzzy-matches&batch=batch_123",
          current: true,
        },
      ]);
    });
  });

  describe("Route Detection", () => {
    it("detects reference data routes", () => {
      expect(
        isLookupRoute("/playground/reference-data", new URLSearchParams(""))
      ).toBe(true);
      expect(
        isLookupRoute(
          "/playground/reference-data",
          new URLSearchParams("file=ref_123")
        )
      ).toBe(true);
    });

    it("detects lookup configuration routes", () => {
      const searchParams = new URLSearchParams("action=configure-lookup");
      expect(isLookupRoute("/playground/template-builder", searchParams)).toBe(
        true
      );
      expect(
        isLookupRoute("/playground/template-builder", new URLSearchParams(""))
      ).toBe(false);
    });

    it("detects fuzzy match review routes", () => {
      const searchParams = new URLSearchParams("review=fuzzy-matches");
      expect(isLookupRoute("/playground/data-table", searchParams)).toBe(true);
      expect(
        isLookupRoute("/playground/data-table", new URLSearchParams(""))
      ).toBe(false);
    });

    it("does not detect non-lookup routes", () => {
      expect(isLookupRoute("/playground", new URLSearchParams(""))).toBe(false);
      expect(isLookupRoute("/tools/csv-to-json", new URLSearchParams(""))).toBe(
        false
      );
    });
  });

  describe("Suggested Next Actions", () => {
    it("suggests actions for reference data edit completion", () => {
      const searchParams = new URLSearchParams("file=ref_123&mode=edit");
      const actions = getSuggestedNextActions(
        "/playground/reference-data",
        searchParams,
        {
          operationComplete: true,
        }
      );

      expect(actions).toContainEqual({
        label: "View Updated Data",
        href: "/playground/reference-data?file=ref_123&mode=view",
        variant: "primary",
      });

      expect(actions).toContainEqual({
        label: "Back to Reference Data",
        href: "/playground/reference-data",
        variant: "secondary",
      });
    });

    it("suggests actions for reference data viewing", () => {
      const searchParams = new URLSearchParams("file=ref_123&mode=view");
      const actions = getSuggestedNextActions(
        "/playground/reference-data",
        searchParams
      );

      expect(actions).toContainEqual({
        label: "Edit This Data",
        href: "/playground/reference-data?file=ref_123&mode=edit",
        variant: "primary",
      });
    });

    it("returns empty actions for unknown contexts", () => {
      const actions = getSuggestedNextActions(
        "/unknown/route",
        new URLSearchParams("")
      );
      expect(actions).toEqual([]);
    });
  });
});
