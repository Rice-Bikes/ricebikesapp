import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SetProjectsTypesDropdown from "./SetProjectsTypesDropdown";


describe("SetProjectsTypesDropdown", () => {
    it("opens menu and triggers Refurb selection", async () => {
        const setRefurb = vi.fn();
        const setBeerBike = vi.fn();

        render(
            <SetProjectsTypesDropdown setRefurb={setRefurb} setBeerBike={setBeerBike} />,
        );

        fireEvent.click(screen.getByRole("button", { name: /select merge strategy/i }));
        fireEvent.click(screen.getByText("Refurb"));

        expect(setRefurb).toHaveBeenCalledTimes(1);
        expect(setBeerBike).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.queryByText("Refurb")).not.toBeInTheDocument(),
        );
    });

    it("selects Beer Bike path", () => {
        const setRefurb = vi.fn();
        const setBeerBike = vi.fn();

        render(
            <SetProjectsTypesDropdown setRefurb={setRefurb} setBeerBike={setBeerBike} />,
        );

        fireEvent.click(screen.getByRole("button", { name: /select merge strategy/i }));
        fireEvent.click(screen.getByText("Beer Bike"));

        expect(setBeerBike).toHaveBeenCalledTimes(1);
        expect(setRefurb).not.toHaveBeenCalled();
    });
});
