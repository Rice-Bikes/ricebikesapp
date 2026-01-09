import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSlackNotifications } from "./useSlackNotifications";

const serviceMocks = vi.hoisted(() => ({
  sendSlackNotification: vi.fn(),
  notifyBuildReadyForInspection: vi.fn(),
  notifyInspectionCompleted: vi.fn(),
  testSlackIntegration: vi.fn(),
}));

vi.mock("../services/notificationService", () => ({
  __esModule: true,
  default: serviceMocks,
}));

const {
  sendSlackNotification,
  notifyBuildReadyForInspection,
  notifyInspectionCompleted,
  testSlackIntegration,
} = serviceMocks;

describe("useSlackNotifications", () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mockFn) => mockFn.mockReset());
  });

  it("sends a custom notification and clears loading state", async () => {
    sendSlackNotification.mockResolvedValueOnce({
      success: true,
      message: "sent",
    });

    const { result } = renderHook(() => useSlackNotifications());

    await act(async () => {
      const response = await result.current.sendNotification("hello", "manual");
      expect(response).toEqual({ success: true, message: "sent" });
    });

    expect(sendSlackNotification).toHaveBeenCalledWith("hello", "manual");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("captures errors when sending notifications fails", async () => {
    sendSlackNotification.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useSlackNotifications());

    await act(async () => {
      await expect(result.current.sendNotification("oops")).rejects.toThrow("boom");
    });

    expect(result.current.error).toBe("boom");
    expect(result.current.loading).toBe(false);
  });

  it("returns boolean for notifyBuildReady success and failure", async () => {
    notifyBuildReadyForInspection.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useSlackNotifications());

    let successResult = false;
    await act(async () => {
      successResult = await result.current.notifyBuildReady("bike-1", "txn-1", "Alex", "Commuter");
    });
    expect(successResult).toBe(true);
    expect(result.current.error).toBeNull();

    notifyBuildReadyForInspection.mockRejectedValueOnce(new Error("failed"));

    let failureResult = true;
    await act(async () => {
      failureResult = await result.current.notifyBuildReady("bike-1", "txn-1", "Alex", "Commuter");
    });
    expect(failureResult).toBe(false);
    expect(result.current.error).toBe("failed");
  });

  it("returns boolean for notifyInspectionComplete and records errors", async () => {
    notifyInspectionCompleted.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useSlackNotifications());

    let inspectionSuccess = false;
    await act(async () => {
      inspectionSuccess = await result.current.notifyInspectionComplete(
        "bike-1",
        "txn-2",
        "Taylor",
        "Hybrid",
        "All good",
      );
    });
    expect(inspectionSuccess).toBe(true);
    expect(result.current.error).toBeNull();

    notifyInspectionCompleted.mockRejectedValueOnce(new Error("integration fail"));

    let inspectionFailure = true;
    await act(async () => {
      inspectionFailure = await result.current.notifyInspectionComplete(
        "bike-1",
        "txn-2",
        "Taylor",
        "Hybrid",
        "All good",
      );
    });
    expect(inspectionFailure).toBe(false);
    expect(result.current.error).toBe("integration fail");
  });

  it("runs integration tests and surfaces failures", async () => {
    testSlackIntegration.mockResolvedValueOnce({ success: true, message: "ok" });
    const { result } = renderHook(() => useSlackNotifications());

    await act(async () => {
      const resp = await result.current.testIntegration();
      expect(resp).toEqual({ success: true, message: "ok" });
    });

    testSlackIntegration.mockRejectedValueOnce(new Error("nope"));

    await act(async () => {
      await expect(result.current.testIntegration()).rejects.toThrow("nope");
    });
    expect(result.current.error).toBe("nope");
  });
});
