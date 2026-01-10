import { describe, it, expect, vi, beforeEach } from "vitest";
import notificationService from "./notificationService";

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendSlackNotification returns response on success", async () => {
    const fakeResponse = {
      ok: true,
      json: async () => ({ success: true, message: "ok" }),
    } as unknown as Response;

    global.fetch = vi.fn().mockResolvedValue(fakeResponse);

    const res = await notificationService.sendSlackNotification("hello");
    expect(res).toEqual({ success: true, message: "ok" });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("sendSlackNotification throws on non-ok response", async () => {
    const fakeResponse = {
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: "boom" }),
    } as unknown as Response;

    global.fetch = vi.fn().mockResolvedValue(fakeResponse);

    await expect(
      notificationService.sendSlackNotification("hello"),
    ).rejects.toThrow();
  });

  it("notifyBuildReadyForInspection calls sendSlackNotification with build_ready", async () => {
    const spy = vi
      .spyOn(notificationService, "sendSlackNotification")
      .mockResolvedValue({ success: true, message: "ok" });

    await notificationService.notifyBuildReadyForInspection(
      "bike1",
      "tx123",
      "mech",
    );

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Bike"),
      "build_ready",
    );
  });

  it("sendNotificationSafely retries when sendSlackNotification fails and eventually succeeds", async () => {
    const spy = vi
      .spyOn(notificationService, "sendSlackNotification")
      .mockRejectedValueOnce(new Error("failed1"))
      .mockResolvedValueOnce({ success: true, message: "ok" });

    // Use fake timers to avoid waiting during backoff
    vi.useFakeTimers();

    const promise = notificationService.sendNotificationSafely(
      "msg",
      "manual",
      1,
    );

    // Advance timers to let retry backoff resolve
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("notifyInspectionCompleted calls sendSlackNotification with inspection_ready and includes notes", async () => {
    const spy = vi
      .spyOn(notificationService, "sendSlackNotification")
      .mockResolvedValue({ success: true, message: "ok" });

    await notificationService.notifyInspectionCompleted(
      "bike1",
      "tx123",
      "mech",
      "Model X",
      "All good",
    );

    expect(spy).toHaveBeenCalled();
    const messageArg = spy.mock.calls[0][0] as string;
    expect(messageArg).toEqual(expect.stringContaining("Notes:"));
    expect(messageArg).toEqual(expect.stringContaining("All good"));
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Notes:"),
      "inspection_ready",
    );
  });

  it("testSlackIntegration returns response on success", async () => {
    const fakeResponse = {
      json: async () => ({ success: true, message: "pong" }),
    } as unknown as Response;

    global.fetch = vi.fn().mockResolvedValue(fakeResponse);

    const res = await notificationService.testSlackIntegration();
    expect(res).toEqual({ success: true, message: "pong" });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("testSlackIntegration throws and logs when fetch rejects", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(notificationService.testSlackIntegration()).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("sendNotificationSafely returns false after exhausting retries and logs error", async () => {
    const spy = vi
      .spyOn(notificationService, "sendSlackNotification")
      .mockRejectedValue(new Error("boom"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Use fake timers to avoid waiting during backoff
    vi.useFakeTimers();

    const promise = notificationService.sendNotificationSafely(
      "msg",
      "manual",
      1,
    );

    // Advance timers to let retry backoff resolve
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalled();

    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
  });
});
