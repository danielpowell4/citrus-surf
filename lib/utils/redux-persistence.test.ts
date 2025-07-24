import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { reduxPersistence } from "./redux-persistence";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock timers and setTimeout
vi.useFakeTimers();
const setTimeoutSpy = vi.spyOn(global, "setTimeout");

describe("Redux Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    reduxPersistence.cleanup();
  });

  it("should load state from localStorage", () => {
    const mockState = {
      table: { data: [] },
      history: { actions: [] },
      targetShapes: { shapes: [] },
    };

    // Mock superjson format
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        json: mockState,
        meta: { version: "1.0.0" },
      })
    );

    const loadedState = reduxPersistence.loadState();
    expect(loadedState).toEqual(mockState);
  });

  it("should return undefined when no state is saved", () => {
    localStorageMock.getItem.mockReturnValue(null);

    const loadedState = reduxPersistence.loadState();
    expect(loadedState).toBeUndefined();
  });

  it("should save state with debouncing", () => {
    const mockState = {
      table: { data: [{ id: "1", name: "Test" }] },
      history: { actions: [] },
    };

    // First save
    reduxPersistence.saveState(mockState);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    // Fast forward time
    vi.advanceTimersByTime(1000);

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "citrus-surf-redux-state",
      expect.stringContaining('"json"')
    );
  });

  it("should debounce multiple saves", () => {
    const mockState1 = { table: { data: [] } };
    const mockState2 = { table: { data: [{ id: "1" }] } };
    const mockState3 = { table: { data: [{ id: "1" }, { id: "2" }] } };

    // Multiple rapid saves
    reduxPersistence.saveState(mockState1);
    reduxPersistence.saveState(mockState2);
    reduxPersistence.saveState(mockState3);

    // Should not have saved yet
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    // Fast forward time
    vi.advanceTimersByTime(1000);

    // Should have saved only once with the last state
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
  });

  it("should clear persisted state", () => {
    reduxPersistence.clearState();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "citrus-surf-redux-state"
    );
  });

  it("should get persistence status", () => {
    // Mock valid superjson format
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        json: { table: { data: [] } },
        meta: { version: "1.0.0" },
      })
    );

    const status = reduxPersistence.getStatus();
    expect(status.hasPersistedState).toBe(true);
    expect(status.isInitialized).toBe(false);
  });

  it("should mark as initialized", () => {
    reduxPersistence.markInitialized();

    const status = reduxPersistence.getStatus();
    expect(status.isInitialized).toBe(true);
  });

  it("should handle errors gracefully", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("Storage error");
    });

    const mockState = { table: { data: [] } };
    reduxPersistence.saveState(mockState);

    vi.advanceTimersByTime(1000);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error saving to localStorage (citrus-surf-redux-state):",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should handle server-side rendering", () => {
    // Mock window as undefined (SSR)
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const mockState = { table: { data: [] } };
    reduxPersistence.saveState(mockState);

    const loadedState = reduxPersistence.loadState();
    expect(loadedState).toBeUndefined();

    const status = reduxPersistence.getStatus();
    expect(status.isInitialized).toBe(false);
    expect(status.hasPersistedState).toBe(false);

    // Restore window
    global.window = originalWindow;
  });

  it("should cleanup timers on cleanup", () => {
    const mockState = { table: { data: [] } };
    reduxPersistence.saveState(mockState);

    // Should have a pending timer
    expect(setTimeoutSpy).toHaveBeenCalled();

    reduxPersistence.cleanup();

    // Fast forward time - should not save because timer was cleared
    vi.advanceTimersByTime(1000);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});
