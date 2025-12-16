import { useState } from "react";
import {
  Box,
  Button,
  Select,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Card,
  CardHeader,
  CardContent,
  Divider,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { subDays, startOfMonth, endOfMonth } from "date-fns";

import { EXPORT_ENDPOINTS, downloadFile } from "./dataExportUtils";

// buildQueryString moved to ./dataExportUtils

// downloadFile moved to ./dataExportUtils

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

  function handleSelectChange(e: SelectChangeEvent) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name!]: value }));
  }

  function formatDateOnly(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function handleStartChange(newValue: Date | null) {
    setFilters((prev) => ({
      ...prev,
      startDate: newValue ? formatDateOnly(newValue) : "",
    }));
  }

  function handleEndChange(newValue: Date | null) {
    setFilters((prev) => ({
      ...prev,
      endDate: newValue ? formatDateOnly(newValue) : "",
    }));
  }

  function setRange(start: Date, end: Date) {
    setFilters((prev) => ({
      ...prev,
      startDate: formatDateOnly(start),
      endDate: formatDateOnly(end),
    }));
  }

  function clearFilters() {
    setFilters({
      startDate: "",
      endDate: "",
      transactionType: "",
      isCompleted: "",
      isPaid: "",
      includeRefurb: "true",
      includeEmployee: "true",
    });
  }

  const today = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card variant="outlined" sx={{ mb: 4, mt: 2 }}>
        <CardHeader
          title="Data Export"
          subheader="Choose filters and download the reports you need"
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRange(today, today)}
              >
                Today
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRange(subDays(today, 6), today)}
              >
                Last 7 days
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRange(subDays(today, 29), today)}
              >
                Last 30 days
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setRange(startOfMonth(today), endOfMonth(today))}
              >
                This month
              </Button>
              <Box flexGrow={1} />
              <Button size="small" onClick={clearFilters}>
                Clear filters
              </Button>
            </Stack>

            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="Start Date"
                  value={
                    filters.startDate
                      ? new Date(filters.startDate + "T00:00:00")
                      : null
                  }
                  onChange={handleStartChange}
                  slotProps={{
                    textField: {
                      name: "startDate",
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <DatePicker
                  label="End Date"
                  value={
                    filters.endDate
                      ? new Date(filters.endDate + "T00:00:00")
                      : null
                  }
                  onChange={handleEndChange}
                  slotProps={{
                    textField: {
                      name: "endDate",
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="isCompleted-label">
                    Completed Transaction?
                  </InputLabel>
                  <Select
                    labelId="isCompleted-label"
                    name="isCompleted"
                    value={filters.isCompleted}
                    label="Completed Transaction?"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
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
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="includeRefurb-label">
                    Include Refurb
                  </InputLabel>
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
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="includeEmployee-label">
                    Include Employee
                  </InputLabel>
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
              </Grid2>
            </Grid2>

            <Divider />

            <Grid2 container spacing={2}>
              {EXPORT_ENDPOINTS.map((ep) => (
                <Grid2 key={ep.path + ep.type} size={{ xs: 12, md: 6, lg: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      ep.acceptsFilters
                        ? downloadFile(ep.path, ep.filename, ep.type, filters)
                        : downloadFile(ep.path, ep.filename, ep.type)
                    }
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {ep.label}
                  </Button>
                </Grid2>
              ))}
            </Grid2>
          </Stack>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}
