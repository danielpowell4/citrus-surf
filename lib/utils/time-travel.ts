import { AppDispatch } from "@/lib/store";
import { HistoryAction } from "@/lib/features/historySlice";
import {
  setData,
  setSorting,
  defaultData,
  setColumnFilters,
  setColumnVisibility,
  setRowSelection,
  setGlobalFilter,
  setGrouping,
  setExpanded,
  setPagination,
  setImportData,
  clearImportData,
  setLoading,
  setError,
  setColumnOrder,
  setAppliedTargetShapeId,
} from "@/lib/features/tableSlice";

export interface TimeTravelOptions {
  restoreData?: boolean;
  restoreSorting?: boolean;
  restoreFilters?: boolean;
  restoreVisibility?: boolean;
  restorePagination?: boolean;
  restoreImportData?: boolean;
}

export const restoreStateToAction = (
  dispatch: AppDispatch,
  action: HistoryAction,
  options: TimeTravelOptions = {}
) => {
  const {
    restoreData = true,
    restoreSorting = true,
    restoreFilters = true,
    restoreVisibility = true,
    restorePagination = true,
    restoreImportData = true,
  } = options;

  if (!action.stateSnapshot) {
    console.warn("No state snapshot available for action:", action.type);
    return;
  }

  const snapshot = action.stateSnapshot;

  // Restore data
  if (restoreData && snapshot.data) {
    dispatch(setData(snapshot.data));
  }

  // Restore sorting
  if (restoreSorting && snapshot.sorting) {
    dispatch(setSorting(snapshot.sorting));
  }

  // Restore column filters
  if (restoreFilters && snapshot.columnFilters) {
    dispatch(setColumnFilters(snapshot.columnFilters));
  }

  // Restore global filter
  if (restoreFilters && snapshot.globalFilter !== undefined) {
    dispatch(setGlobalFilter(snapshot.globalFilter));
  }

  // Restore column visibility
  if (restoreVisibility && snapshot.columnVisibility) {
    dispatch(setColumnVisibility(snapshot.columnVisibility));
  }

  // Restore row selection
  if (restoreVisibility && snapshot.rowSelection) {
    dispatch(setRowSelection(snapshot.rowSelection));
  }

  // Restore grouping
  if (restoreVisibility && snapshot.grouping) {
    dispatch(setGrouping(snapshot.grouping));
  }

  // Restore expanded state
  if (restoreVisibility && snapshot.expanded) {
    dispatch(setExpanded(snapshot.expanded));
  }

  // Restore pagination
  if (restorePagination && snapshot.pagination) {
    dispatch(setPagination(snapshot.pagination));
  }

  // Restore import data
  if (restoreImportData) {
    if (snapshot.importData) {
      dispatch(setImportData(snapshot.importData));
    } else {
      dispatch(clearImportData());
    }
  }

  // Restore column order (critical for template applications)
  if (snapshot.columnOrder) {
    dispatch(setColumnOrder(snapshot.columnOrder));
  }

  // Restore applied target shape ID (critical for template applications)
  if (snapshot.appliedTargetShapeId !== undefined) {
    dispatch(setAppliedTargetShapeId(snapshot.appliedTargetShapeId));
  }

  // Restore loading and error states
  if (snapshot.isLoading !== undefined) {
    dispatch(setLoading(snapshot.isLoading));
  }
  if (snapshot.error !== undefined) {
    dispatch(setError(snapshot.error));
  }
};

export const resetToInitialState = (dispatch: AppDispatch) => {
  // Reset all table state to initial values
  dispatch(setData(defaultData));
  dispatch(setSorting([{ id: "id", desc: false }]));
  dispatch(setColumnFilters([]));
  dispatch(setColumnVisibility({}));
  dispatch(setRowSelection({}));
  dispatch(setGlobalFilter(""));
  dispatch(setGrouping([]));
  dispatch(setExpanded({}));
  dispatch(setPagination({ pageIndex: 0, pageSize: 10 }));
  dispatch(clearImportData());
  dispatch(setLoading(false));
  dispatch(setError(null));
};

/**
 * Generates human-readable summaries for history actions
 *
 * This function provides descriptive text for each action type that appears
 * in the history drawer. Add new cases here when adding new actions to
 * provide clear descriptions for users.
 *
 * @param action - The history action to summarize
 * @returns A human-readable description of the action
 */
export const getActionSummary = (action: HistoryAction) => {
  const actionType = action.type.replace("table/", "");

  switch (actionType) {
    case "setData":
      return `Loaded ${action.payload?.length || 0} rows of data`;
    case "applyTemplate":
      return `Applied shape: ${action.payload?.targetShapeName || "Unknown"}`;
    case "importJsonData":
      return "Imported JSON data";
    case "updateCell":
      return `Updated cell: ${action.payload?.rowId} - ${action.payload?.columnId}`;
    case "setSorting":
      return `Updated sorting (${action.payload?.length || 0} columns)`;
    case "toggleColumnSort":
      return `Toggled sort for column: ${action.payload?.columnId}`;
    case "setColumnFilters":
      return `Updated filters (${action.payload?.length || 0} active)`;
    case "setGlobalFilter":
      return `Updated global search: "${action.payload}"`;
    case "setColumnVisibility":
      return "Updated column visibility";
    case "setRowSelection":
      return "Updated row selection";
    case "setPagination":
      return `Updated pagination: page ${action.payload?.pageIndex + 1}`;
    case "setImportData":
      return "Updated import data";
    case "clearImportData":
      return "Cleared import data";
    case "restoreFromHistory":
      const restoredFrom = action.payload?.restoredFrom;
      const _restoredAction = action.payload?.restoredFromAction;
      if (restoredFrom !== undefined) {
        return `Restored from version ${restoredFrom + 1}`;
      }
      return "Restored from history";
    case "processDataWithLookups/fulfilled":
      return `Processed ${action.stateSnapshot?.data?.length || 0} rows with lookups`;
    case "updateLookupValue/fulfilled":
      return `Updated lookup value for ${action.payload?.fieldName || 'field'}`;
    default:
      return actionType;
  }
};

export const getActionCategory = (actionType: string) => {
  if (actionType.includes("restoreFromHistory")) {
    return "restore";
  }
  if (
    actionType.includes("setData") ||
    actionType.includes("importJsonData") ||
    actionType.includes("updateCell") ||
    actionType.includes("processDataWithLookups") ||
    actionType.includes("updateLookupValue")
  ) {
    return "data";
  }
  if (actionType.includes("Sort") || actionType.includes("toggleColumnSort")) {
    return "sorting";
  }
  if (actionType.includes("Filter") || actionType.includes("setGlobalFilter")) {
    return "filtering";
  }
  if (
    actionType.includes("Visibility") ||
    actionType.includes("setRowSelection") ||
    actionType.includes("setGrouping") ||
    actionType.includes("setExpanded")
  ) {
    return "visibility";
  }
  if (actionType.includes("Pagination")) {
    return "pagination";
  }
  if (
    actionType.includes("ImportData") ||
    actionType.includes("clearImportData")
  ) {
    return "import";
  }
  return "other";
};
