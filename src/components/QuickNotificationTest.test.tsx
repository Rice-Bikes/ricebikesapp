import { describe, it, expect, vi, beforeEach, MockedFunction } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuickNotificationTest from "./SlackNotificationTester";
import { useSlackNotifications } from "../hooks/useSlackNotifications";

vi.mock("../hooks/useSlackNotifications", () => ({
    useSlackNotifications: vi.fn(),
}));


const mockSendNotification = vi.fn();
const mockNotifyBuildReady = vi.fn();
const mockNotifyInspectionComplete = vi.fn();
const mockTestIntegration = vi.fn();

const mockHook = useSlackNotifications as MockedFunction<typeof useSlackNotifications>;

describe("QuickNotificationTest", () => {
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
        mockSendNotification.mockResolvedValue({ success: true, message: "ok" });
        mockNotifyBuildReady.mockResolvedValue(true);
        mockNotifyInspectionComplete.mockResolvedValue(true);
        mockTestIntegration.mockResolvedValue({ success: true });
    });

    it("sends a custom notification and shows success message", async () => {
        render(<QuickNotificationTest />);

        const input = screen.getByLabelText(/Custom Message/i);
        fireEvent.change(input, { target: { value: "Hello world" } });

        fireEvent.click(screen.getByRole("button", { name: /Send Custom Message/i }));

        await waitFor(() =>
            expect(mockSendNotification).toHaveBeenCalledWith("Hello world", "manual"),
        );

        await waitFor(() =>
            expect(screen.getByText(/Custom message sent/i)).toBeInTheDocument(),
        );
    });

    it("handles errors from custom notifications", async () => {
        mockSendNotification.mockRejectedValueOnce(new Error("boom"));

        render(<QuickNotificationTest />);

        const input = screen.getByLabelText(/Custom Message/i);
        fireEvent.change(input, { target: { value: "Hello world" } });

        fireEvent.click(screen.getByRole("button", { name: /Send Custom Message/i }));

        await waitFor(() => expect(screen.getByText(/boom/)).toBeInTheDocument());
    });

    it("runs build ready test", async () => {
        render(<QuickNotificationTest />);

        fireEvent.click(
            screen.getByRole("button", { name: /Test "Build Ready" Notification/i }),
        );

        await waitFor(() => expect(mockNotifyBuildReady).toHaveBeenCalled());

        await waitFor(() =>
            expect(
                screen.getByText(/Build ready notification sent successfully/i),
            ).toBeVisible(),
        );
    });
});
