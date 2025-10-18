import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import AuthPrompt from "./AuthPrompt";
import { queryClient } from "../../app/queryClient";
import { UserProvider } from "../../contexts/UserContext";

// Mock react-toastify
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock the DB model fetch that useUser() calls under the hood
const { fetchUserMock } = vi.hoisted(() => ({
  fetchUserMock: vi.fn(),
}));
vi.mock("../../model", () => ({
  __esModule: true,
  default: {
    fetchUser: fetchUserMock,
  },
}));

const mockUser = {
  user_id: "test123",
  username: "test123",
  firstname: "Test",
  lastname: "User",
  active: true,
  permissions: [
    {
      id: 1,
      name: "admin",
      description: "Administrator",
    },
  ],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>{children}</UserProvider>
  </QueryClientProvider>
);

describe("AuthPrompt Component (context-driven auth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("renders dialog with netId input field", () => {
    render(<AuthPrompt />, { wrapper });

    expect(screen.getByText("Enter your NetID")).toBeInTheDocument();
    expect(screen.getByLabelText("NetID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  test("shows initial timer value", () => {
    render(<AuthPrompt />, { wrapper });

    expect(screen.getByText("Session expires in 7:00")).toBeInTheDocument();
  });

  test("updates timer correctly", async () => {
    vi.useFakeTimers();
    render(<AuthPrompt />, { wrapper });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Session expires in 6:59")).toBeInTheDocument();
    vi.useRealTimers();
  });

  test("handles successful user login (via context + query)", async () => {
    fetchUserMock.mockResolvedValueOnce(mockUser);

    render(<AuthPrompt />, { wrapper });

    // Enter netId value
    fireEvent.change(screen.getByLabelText("NetID"), {
      target: { value: "test123" },
    });

    // Click submit - setUserId triggers the context change, which enables the query
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Make sure the query hits the mocked backend with our id
    await waitFor(() => {
      expect(fetchUserMock).toHaveBeenCalledWith("test123");
    });

    // Dialog should close once user is loaded
    await waitFor(() => {
      expect(screen.queryByText("Enter your NetID")).not.toBeInTheDocument();
    });

    // The NetID input should no longer be in the DOM
    expect(screen.queryByLabelText("NetID")).not.toBeInTheDocument();

    // Header shows current user name
    expect(screen.getByText("Current User: Test User")).toBeInTheDocument();
  });

  test("displays error message for invalid netId", async () => {
    fetchUserMock.mockRejectedValueOnce(new Error("Invalid netId"));

    render(<AuthPrompt />, { wrapper });

    fireEvent.change(screen.getByLabelText("NetID"), {
      target: { value: "badid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Error helper text is shown
    await screen.findByText("Invalid netId");

    // Dialog remains open so user can retry
    expect(screen.getByText("Enter your NetID")).toBeInTheDocument();
  });

  test("handles Enter key press to submit", async () => {
    fetchUserMock.mockResolvedValueOnce(mockUser);

    render(<AuthPrompt />, { wrapper });

    const input = screen.getByLabelText("NetID");
    fireEvent.change(input, { target: { value: "test123" } });

    // Press Enter key - this should trigger handleSubmit
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(fetchUserMock).toHaveBeenCalledWith("test123");
    });

    // Dialog should close once user is loaded
    await waitFor(() => {
      expect(screen.queryByText("Enter your NetID")).not.toBeInTheDocument();
    });
  });

  test("resets session when timer expires (logout via context)", async () => {
    vi.useFakeTimers();

    // Start logged-in by letting the first fetch succeed
    fetchUserMock.mockResolvedValueOnce(mockUser);

    render(
      <QueryClientProvider client={queryClient}>
        <UserProvider initialUserId="test123">
          <AuthPrompt timerDurationSeconds={1} />
        </UserProvider>
      </QueryClientProvider>,
    );
    // Flush React Query notify batching + any pending timers once after render
    await act(async () => {
      // let any microtasks resolve
      await Promise.resolve();
      // run any setTimeout(0) scheduled by React Query notifyManager
      vi.runOnlyPendingTimers();
    });

    // Wait until dialog closes (user loaded)
    await waitFor(() => {
      expect(screen.queryByText("Enter your NetID")).not.toBeInTheDocument();
    });

    // Advance to end of timer - logout should happen and dialog reopen
    await act(async () => {
      vi.advanceTimersByTime(1 * 1000);
      // react-query and component state updates may also queue timers
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    });

    expect(screen.getByText("Enter your NetID")).toBeInTheDocument();
    expect(screen.getByText("Current User: None")).toBeInTheDocument();
  }, 10000);
});
