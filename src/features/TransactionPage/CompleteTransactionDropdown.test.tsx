import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CompleteTransactionDropdown from "./CompleteTransactionDropdown";


describe("CompleteTransactionDropdown", () => {
    it("opens the menu and triggers sendEmail", async () => {
        const sendEmail = vi.fn();
        const completeTransaction = vi.fn();

        render(
            <CompleteTransactionDropdown
                sendEmail={sendEmail}
                completeTransaction={completeTransaction}
                disabled={false}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: /select merge strategy/i }),
        );

        fireEvent.click(screen.getByText("Send Email"));

        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(completeTransaction).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.queryByText("Send Email")).not.toBeInTheDocument(),
        );
    });

    it("disables toggle and triggers completion without email", () => {
        const sendEmail = vi.fn();
        const completeTransaction = vi.fn();

        const { rerender } = render(
            <CompleteTransactionDropdown
                sendEmail={sendEmail}
                completeTransaction={completeTransaction}
                disabled={true}
            />,
        );

        const toggleBtn = screen.getByRole("button", { name: /select merge strategy/i });
        expect(toggleBtn).toBeDisabled();

        rerender(
            <CompleteTransactionDropdown
                sendEmail={sendEmail}
                completeTransaction={completeTransaction}
                disabled={false}
            />,
        );

        fireEvent.click(toggleBtn);
        fireEvent.click(screen.getByText("Complete w/out Email"));

        expect(completeTransaction).toHaveBeenCalledTimes(1);
        expect(sendEmail).not.toHaveBeenCalled();
    });
});
