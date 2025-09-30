import React, { useState } from "react";
import { Box, Button, TextField, Select, Stack, MenuItem, FormControl, InputLabel, SelectChangeEvent } from "@mui/material";
import { hostname } from '../../model';

const EXPORT_ENDPOINTS: Array<{
    label: string;
    path: string;
    type: "excel" | "json";
    filename: string;
    acceptsFilters?: boolean;
}> = [
        {
            label: "Download Repair Summary Report",
            path: "/data-export/excel/full-report",
            type: "excel",
            filename: "full-report.xlsx",
            acceptsFilters: true
        },
        {
            label: "Download Bike Inventory (Excel)",
            path: "/data-export/excel/bike-inventory",
            type: "excel",
            filename: "bike-inventory.xlsx"
        },
        {
            label: "Download Repair History (Excel)",
            path: "/data-export/excel/repair-history",
            type: "excel",
            filename: "repair-history.xlsx",
            acceptsFilters: true
        },
    ];

function buildQueryString(filters: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") params.append(key, value);
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

async function downloadFile(path: string, filename: string, type: "excel" | "json", filters?: Record<string, string | undefined>) {
    try {
        const url = `${hostname}${path}${filters ? buildQueryString(filters) : ""}`;
        const res = await fetch(url, {
            method: "GET",
            headers: type === "json" ? { Accept: "application/json" } : {},
        });
        if (!res.ok) throw new Error("Failed to download");
        if (type === "excel") {
            const contentType = res.headers.get("Content-Type");
            if (!contentType || !contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
                // Try to parse error message
                let text = await res.text();
                text = JSON.parse(text).message || text;
                throw new Error("Server did not return a valid Excel file. " + text);
            }
            const blob = await res.blob();
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } else {
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    } catch (err: unknown) {
        alert("Download failed: " + (err instanceof Error ? err.message : String(err)));
    }
}

export default function DataExportButtons() {
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        transactionType: "",
        isCompleted: "",
        isPaid: "",
        includeRefurb: "true",
        includeEmployee: "true",
    });

    function handleTextChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    }
    function handleSelectChange(e: SelectChangeEvent) {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name!]: value }));
    }

    return (
        <Box display="flex" flexDirection="column" gap={2} my={2}>
            <Box component="form" display="flex" flexWrap="wrap" gap={2} mb={2} onSubmit={e => e.preventDefault()}>
                <TextField
                    type="date"
                    name="startDate"
                    label="Start Date"
                    value={filters.startDate}
                    onChange={handleTextChange}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    type="date"
                    name="endDate"
                    label="End Date"
                    value={filters.endDate}
                    onChange={handleTextChange}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    name="transactionType"
                    label="Transaction Type"
                    value={filters.transactionType}
                    onChange={handleTextChange}
                />
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id="isCompleted-label">Completed?</InputLabel>
                    <Select
                        labelId="isCompleted-label"
                        name="isCompleted"
                        value={filters.isCompleted}
                        label="Completed?"
                        onChange={handleSelectChange}
                    >
                        <MenuItem value="">Any</MenuItem>
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id="isPaid-label">Paid?</InputLabel>
                    <Select
                        labelId="isPaid-label"
                        name="isPaid"
                        value={filters.isPaid}
                        label="Paid?"
                        onChange={handleSelectChange}
                    >
                        <MenuItem value="">Any</MenuItem>
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel id="includeRefurb-label">Include Refurb</InputLabel>
                    <Select
                        labelId="includeRefurb-label"
                        name="includeRefurb"
                        value={filters.includeRefurb}
                        label="Include Refurb"
                        onChange={handleSelectChange}
                    >
                        <MenuItem value="true">Include Refurb</MenuItem>
                        <MenuItem value="false">Exclude Refurb</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 170 }}>
                    <InputLabel id="includeEmployee-label">Include Employee</InputLabel>
                    <Select
                        labelId="includeEmployee-label"
                        name="includeEmployee"
                        value={filters.includeEmployee}
                        label="Include Employee"
                        onChange={handleSelectChange}
                    >
                        <MenuItem value="true">Include Employee</MenuItem>
                        <MenuItem value="false">Exclude Employee</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Stack direction={"row"} >
                {EXPORT_ENDPOINTS.map((ep) => (
                    <Button
                        key={ep.path + ep.type}
                        variant="contained"
                        color="primary"
                        sx={{ width: "40%", textAlign: 'left' }}
                        onClick={() =>
                            ep.acceptsFilters
                                ? downloadFile(ep.path, ep.filename, ep.type, filters)
                                : downloadFile(ep.path, ep.filename, ep.type)
                        }
                    >
                        {ep.label}
                    </Button>
                ))}
            </Stack>
        </Box>
    );
}
