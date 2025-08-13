/**
 * Navigation utilities for lookup field workflows
 * Provides type-safe route generation and navigation helpers
 */

// Route parameter types
export interface ReferenceDataRouteParams {
  file?: string;
  mode?: "view" | "edit";
}

export interface LookupConfigRouteParams {
  field?: string;
  action?: "configure-lookup";
}

export interface FuzzyMatchReviewRouteParams {
  review?: "fuzzy-matches";
  batch?: string;
}

// Base route paths
export const LOOKUP_ROUTES = {
  REFERENCE_DATA: "/playground/reference-data",
  TEMPLATE_BUILDER: "/playground/template-builder",
  DATA_TABLE: "/playground/data-table",
} as const;

/**
 * Generate URL for reference data management
 */
export function generateReferenceDataUrl(
  params?: ReferenceDataRouteParams
): string {
  const url = new URL(LOOKUP_ROUTES.REFERENCE_DATA, "http://localhost");

  if (params?.file) {
    url.searchParams.set("file", params.file);
  }

  if (params?.mode) {
    url.searchParams.set("mode", params.mode);
  }

  return url.pathname + url.search;
}

/**
 * Generate URL for lookup field configuration in template builder
 */
export function generateLookupConfigUrl(
  params?: LookupConfigRouteParams
): string {
  const url = new URL(LOOKUP_ROUTES.TEMPLATE_BUILDER, "http://localhost");

  if (params?.field) {
    url.searchParams.set("field", params.field);
  }

  if (params?.action) {
    url.searchParams.set("action", params.action);
  }

  return url.pathname + url.search;
}

/**
 * Generate URL for fuzzy match review
 */
export function generateFuzzyMatchReviewUrl(
  params?: FuzzyMatchReviewRouteParams
): string {
  const url = new URL(LOOKUP_ROUTES.DATA_TABLE, "http://localhost");

  if (params?.review) {
    url.searchParams.set("review", params.review);
  }

  if (params?.batch) {
    url.searchParams.set("batch", params.batch);
  }

  return url.pathname + url.search;
}

/**
 * Parse reference data route parameters from URL search params
 */
export function parseReferenceDataParams(
  searchParams: URLSearchParams
): ReferenceDataRouteParams {
  const params: ReferenceDataRouteParams = {};

  const file = searchParams.get("file");
  if (file) {
    params.file = file;
  }

  const mode = searchParams.get("mode");
  if (mode === "view" || mode === "edit") {
    params.mode = mode;
  }

  return params;
}

/**
 * Parse lookup configuration route parameters from URL search params
 */
export function parseLookupConfigParams(
  searchParams: URLSearchParams
): LookupConfigRouteParams {
  const params: LookupConfigRouteParams = {};

  const field = searchParams.get("field");
  if (field) {
    params.field = field;
  }

  const action = searchParams.get("action");
  if (action === "configure-lookup") {
    params.action = action;
  }

  return params;
}

/**
 * Parse fuzzy match review route parameters from URL search params
 */
export function parseFuzzyMatchReviewParams(
  searchParams: URLSearchParams
): FuzzyMatchReviewRouteParams {
  const params: FuzzyMatchReviewRouteParams = {};

  const review = searchParams.get("review");
  if (review === "fuzzy-matches") {
    params.review = review;
  }

  const batch = searchParams.get("batch");
  if (batch) {
    params.batch = batch;
  }

  return params;
}

/**
 * Navigation helper for redirecting after successful operations
 */
export interface RedirectOptions {
  replace?: boolean;
  preserveSearchParams?: boolean;
}

export class LookupNavigator {
  private router: any;
  private pathname: string;
  private searchParams: URLSearchParams;

  constructor(router: any, pathname: string, searchParams: URLSearchParams) {
    this.router = router;
    this.pathname = pathname;
    this.searchParams = searchParams;
  }

  /**
   * Navigate to reference data viewer
   */
  toReferenceDataViewer(fileId: string, options?: RedirectOptions) {
    const url = generateReferenceDataUrl({ file: fileId, mode: "view" });

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }

  /**
   * Navigate to reference data editor
   */
  toReferenceDataEditor(fileId: string, options?: RedirectOptions) {
    const url = generateReferenceDataUrl({ file: fileId, mode: "edit" });

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }

  /**
   * Navigate to lookup field configuration
   */
  toLookupConfiguration(fieldId: string, options?: RedirectOptions) {
    const url = generateLookupConfigUrl({
      field: fieldId,
      action: "configure-lookup",
    });

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }

  /**
   * Navigate to fuzzy match review
   */
  toFuzzyMatchReview(batchId: string, options?: RedirectOptions) {
    const url = generateFuzzyMatchReviewUrl({
      review: "fuzzy-matches",
      batch: batchId,
    });

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }

  /**
   * Navigate back to data table with processed data
   */
  toDataTableWithResults(options?: RedirectOptions) {
    const url = LOOKUP_ROUTES.DATA_TABLE;

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }

  /**
   * Navigate back to template builder
   */
  toTemplateBuilder(options?: RedirectOptions) {
    const url = LOOKUP_ROUTES.TEMPLATE_BUILDER;

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }

  /**
   * Navigate back to reference data management
   */
  toReferenceDataManagement(options?: RedirectOptions) {
    const url = LOOKUP_ROUTES.REFERENCE_DATA;

    if (options?.replace) {
      this.router.replace(url);
    } else {
      this.router.push(url);
    }
  }
}

/**
 * Hook for creating a LookupNavigator instance
 * Usage: const navigator = useLookupNavigator();
 */
export function createLookupNavigator(
  router: any,
  pathname: string,
  searchParams: URLSearchParams
): LookupNavigator {
  return new LookupNavigator(router, pathname, searchParams);
}

/**
 * Validate if a route parameter matches expected pattern
 */
export function isValidReferenceId(id: string): boolean {
  return /^ref_[0-9A-Z]{26}$/.test(id);
}

export function isValidBatchId(id: string): boolean {
  return /^batch_[0-9A-Z]{26}$/.test(id);
}

export function isValidFuzzyMatchId(id: string): boolean {
  // Support both ULID format and our composite format: match_${rowId}_${fieldName}_${index}
  return /^match_([0-9A-Z]{25}|.+_.+_\d+|\d{3})$/.test(id);
}

/**
 * Extract breadcrumb information from current route
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

export function generateLookupBreadcrumbs(
  pathname: string,
  searchParams: URLSearchParams
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Playground", href: "/playground" },
  ];

  if (pathname.startsWith("/playground/reference-data")) {
    breadcrumbs.push({
      label: "Reference Data",
      href: "/playground/reference-data",
    });

    const params = parseReferenceDataParams(searchParams);
    if (params.file) {
      breadcrumbs.push({
        label: params.mode === "edit" ? "Edit File" : "View File",
        href: generateReferenceDataUrl(params),
        current: true,
      });
    } else {
      breadcrumbs[breadcrumbs.length - 1].current = true;
    }
  } else if (pathname.startsWith("/playground/template-builder")) {
    breadcrumbs.push({
      label: "Template Builder",
      href: "/playground/template-builder",
    });

    const params = parseLookupConfigParams(searchParams);
    if (params.action === "configure-lookup") {
      breadcrumbs.push({
        label: "Configure Lookup",
        href: generateLookupConfigUrl(params),
        current: true,
      });
    } else {
      breadcrumbs[breadcrumbs.length - 1].current = true;
    }
  } else if (pathname.startsWith("/playground/data-table")) {
    breadcrumbs.push({ label: "Data Table", href: "/playground/data-table" });

    const params = parseFuzzyMatchReviewParams(searchParams);
    if (params.review === "fuzzy-matches") {
      breadcrumbs.push({
        label: "Review Fuzzy Matches",
        href: generateFuzzyMatchReviewUrl(params),
        current: true,
      });
    } else {
      breadcrumbs[breadcrumbs.length - 1].current = true;
    }
  }

  return breadcrumbs;
}

/**
 * Check if current route is a lookup-related route
 */
export function isLookupRoute(
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  if (pathname === "/playground/reference-data") {
    return true;
  }

  if (
    pathname === "/playground/template-builder" &&
    searchParams.has("action")
  ) {
    return searchParams.get("action") === "configure-lookup";
  }

  if (pathname === "/playground/data-table" && searchParams.has("review")) {
    return searchParams.get("review") === "fuzzy-matches";
  }

  return false;
}

/**
 * Get suggested next actions based on current route and context
 */
export interface NextAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

export function getSuggestedNextActions(
  pathname: string,
  searchParams: URLSearchParams,
  context?: {
    hasUnsavedChanges?: boolean;
    operationComplete?: boolean;
    referenceId?: string;
    fieldId?: string;
    batchId?: string;
  }
): NextAction[] {
  const actions: NextAction[] = [];

  if (pathname === "/playground/reference-data") {
    const params = parseReferenceDataParams(searchParams);

    if (params.mode === "edit" && context?.operationComplete) {
      actions.push({
        label: "View Updated Data",
        href: generateReferenceDataUrl({ file: params.file, mode: "view" }),
        variant: "primary",
      });
      actions.push({
        label: "Back to Reference Data",
        href: generateReferenceDataUrl(),
        variant: "secondary",
      });
    } else if (params.mode === "view") {
      actions.push({
        label: "Edit This Data",
        href: generateReferenceDataUrl({ file: params.file, mode: "edit" }),
        variant: "primary",
      });
    }
  }

  return actions;
}
