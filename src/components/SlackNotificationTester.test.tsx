import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SlackNotificationTester from "./SlackNotificationTester";
import { useSlackNotifications } from "../hooks/useSlackNotifications";

vi.mock("../hooks/useSlackNotifications", () => ({
  useSlackNotifications: vi.fn(),
}));


const mockSendNotification = vi.fn();
const mockNotifyBuildReady = vi.fn();
const mockNotifyInspectionComplete = vi.fn();
const mockTestIntegration = vi.fn();

const mockHook = useSlackNotifications as MockedFunction<typeof useSlackNotifications>;

describe("SlackNotificationTester", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook.mockReturnValue({
      sendNotification: mockSendNotification,
      notifyBuildReady: mockNotifyBuildReady,
      notifyInspectionComplete: mockNotifyInspectionComplete,
      testIntegration: mockTestIntegration,
      loading: false,
      error: null,
    });
  });

  it("runs the integration test workflow", async () => {
    mockTestIntegration.mockResolvedValueOnce({ success: true, message: "OK" });

    render(<SlackNotificationTester />);

    fireEvent.click(screen.getByRole("button", { name: /Test Slack Integration/i }));

    await waitFor(() =>
      expect(mockTestIntegration).toHaveBeenCalledTimes(1),
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Integration test passed/i),
      ).toBeInTheDocument(),
    );
  });

  it("sends a custom message", async () => {
    mockSendNotification.mockResolvedValueOnce({ success: true, message: "sent" });

    render(<SlackNotificationTester />);

    fireEvent.change(screen.getByLabelText(/Custom Message/i), {
      target: { value: "Slack hello" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Custom Message/i }));

    await waitFor(() =>
      expect(mockSendNotification).toHaveBeenCalledWith("Slack hello", "manual"),
    );
  });

  it("invokes build ready and inspection notifications", async () => {
    mockNotifyBuildReady.mockResolvedValueOnce(true);
    mockNotifyInspectionComplete.mockResolvedValueOnce(true);

    render(<SlackNotificationTester />);

    fireEvent.click(
      screen.getByRole("button", { name: /Test "Build Ready" Notification/i }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Test "Inspection Complete" Notification/i }),
    );

    await waitFor(() => expect(mockNotifyBuildReady).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockNotifyInspectionComplete).toHaveBeenCalledTimes(1),
    );
  });

  it("surfaces errors from integration checks", async () => {
    mockTestIntegration.mockRejectedValueOnce(new Error("down"));
    mockHook.mockReturnValueOnce({
      sendNotification: mockSendNotification,
      notifyBuildReady: mockNotifyBuildReady,
      notifyInspectionComplete: mockNotifyInspectionComplete,
      testIntegration: mockTestIntegration,
      loading: false,
      error: "down",
    });

    render(<SlackNotificationTester />);

    await waitFor(() =>
      expect(screen.getByText(/down/)).toBeInTheDocument(),
    );
  });
});
