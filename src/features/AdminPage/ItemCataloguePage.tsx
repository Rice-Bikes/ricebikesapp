import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import {
  CellClassParams,
  ColDef,
  EditableCallbackParams,
  ICellRendererParams,
  NewValueParams,
  ValueGetterParams,
  IRowNode,
} from "ag-grid-community";
import { Part } from "../../model";
import {
  Box,
  Button,
  Typography,
  Stack,
  Skeleton,
  TextField,
  FormControlLabel,
  Switch as MuiSwitch,
  IconButton,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@tanstack/react-query";
import DBModel from "../../model";
import { queryClient } from "../../app/queryClient";
import ItemPageModal from "../../components/ItemPage";
import {
  ErrorSharp,
  ThumbUp,
  Warning,
  Add,
  Remove,
  Search,
  RestartAlt,
} from "@mui/icons-material";
import PriceCheckModal from "../../components/PriceCheckModal";

const getUrgency = (stock: number, minStock: number, name: string) => {
  if (
    minStock === 0 ||
    name.includes("Retrospec") ||
    name.includes("Used") ||
    name.includes("used")
  ) {
    return 0;
  }
  if (stock < minStock) {
    return 3;
  } else if (stock < minStock * 2) {
    return 2;
  } else {
    return 1;
  }
};

const ItemsTable: React.FC = () => {
  const [items, setItems] = useState<Part[]>([]);
  const [selectedItem, setSelectedItem] = useState<Part>();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [showPriceCheckModal, setShowPriceCheckModal] = useState(false);

  // Inventory helpers state
  const [quickFilterText, setQuickFilterText] = useState("");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [showOnlyDisabled, setShowOnlyDisabled] = useState(false);
  const [activateUpc, setActivateUpc] = useState("");

  const gridApiRef = useRef<AgGridReact<Part>>(null);

  const {
    data: itemData,
    error: itemError,
    isLoading: itemsLoading,
  } = useQuery(DBModel.getItemsQuery());

  const deleteItem = useMutation({
    mutationFn: (id: string) => DBModel.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries(DBModel.getItemsQuery());
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item");
    },
  });
  const handleDelete = useCallback(
    (id: string) => {
      deleteItem.mutate(id);
    },
    [deleteItem],
  );

  const updatePart = useMutation({
    mutationFn: (part: Part) => DBModel.updateItem(part),
    onSuccess: () => {
      queryClient.invalidateQueries(DBModel.getItemsQuery());
      toast.success("Item updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });
    },
    onError: (error) => {
      console.error("Error updating item:", error);
      toast.error("Error updating item:" + error);
      queryClient.invalidateQueries({
        queryKey: ["items"],
      });
    },
  });

  const activateByUpc = useMutation({
    mutationFn: (upc: string) => DBModel.activateItem(upc),
    onSuccess: () => {
      queryClient.invalidateQueries(DBModel.getItemsQuery());
      toast.success("Item activated by UPC");
      setActivateUpc("");
    },
    onError: (error) => {
      console.error("Error activating item by UPC:", error);
      toast.error("Activate by UPC failed");
    },
  });
  
  const handleEdit = useCallback((item: Part) => {
    setSelectedItem(item);
    setDialogVisible(true);
  }, []);

  const handleCancel = () => {
    setDialogVisible(false);
    setSelectedItem({} as Part);
  };

  const handleResetFilters = () => {
    setQuickFilterText("");
    setShowOnlyLowStock(false);
    setShowOnlyDisabled(false);
    gridApiRef.current?.api?.setGridOption?.("quickFilterText", "");
    gridApiRef.current?.api?.onFilterChanged();
  };

  if (itemError) {
    toast.error("Error fetching items");
  }

  useEffect(() => {
    if (itemData && !itemsLoading) {
      setItems(itemData);
    }
  }, [itemData, itemsLoading]);

  function isCellEditable(params: EditableCallbackParams | CellClassParams) {
    try {
      if (!params.colDef) return false;
      return (
        params.colDef.field === "stock" ||
        params.colDef.field === "minimum_stock"
      );
    } catch (error) {
      console.error("Error in isCellEditable:", error);
      throw error; // Re-throw to be caught by error boundary
    }
  }

  const columnTypes = useMemo(
    () => ({
      editableColumn: {
        editable: (params: EditableCallbackParams<Part>) => {
          try {
            return isCellEditable(params);
          } catch (error) {
            console.error("Error in editableColumn:", error);
            throw error; // Re-throw to be caught by error boundary
          }
        },
        cellStyle: (params: CellClassParams<Part>) => {
          try {
            if (isCellEditable(params)) {
              return {
                backgroundColor:
                  params.colDef.field === "stock" ? "lightblue" : "lightgreen",
              };
            }
          } catch (error) {
            console.error("Error in cellStyle:", error);
            throw error; // Re-throw to be caught by error boundary
          }
        },
        onCellValueChanged: (event: NewValueParams<Part>) => {
          try {
            const updatedPart = event.data as Part;
            updatePart.mutate(updatedPart);
          } catch (error) {
            console.error("Error in onCellValueChanged:", error);
            throw error; // Re-throw to be caught by error boundary
          }
        },
      },
    }),
    [updatePart],
  );

  // Helpers for inventory operations
  const commitPartUpdate = useCallback(
    async (part: Part) => {
      const safeStock =
        typeof part.stock === "number" && part.stock >= 0
          ? Math.floor(part.stock)
          : 0;
      const safeMin =
        typeof part.minimum_stock === "number" && part.minimum_stock >= 0
          ? Math.floor(part.minimum_stock)
          : 0;

      await updatePart.mutateAsync({
        ...part,
        stock: safeStock,
        minimum_stock: safeMin,
      } as Part);
    },
    [updatePart],
  );

  const adjustStock = useCallback(
    async (part: Part, delta: number) => {
      const current = typeof part.stock === "number" ? part.stock : 0;
      const next = Math.max(current + delta, 0);
      await commitPartUpdate({ ...part, stock: next } as Part);
    },
    [commitPartUpdate],
  );

  const toggleDisabled = useCallback(
    async (part: Part, disabled: boolean) => {
      if (disabled) handleDelete(part.item_id);
    },
    [handleDelete],
  );

  const bulkAdjustStock = useCallback(
    async (delta: number) => {
      const selected = gridApiRef.current?.api?.getSelectedRows() ?? [];
      if (!selected.length) {
        toast.info("No rows selected");
        return;
      }
      await Promise.all(selected.map((p) => adjustStock(p, delta)));
      await queryClient.invalidateQueries(DBModel.getItemsQuery());
      toast.success(`Adjusted stock by ${delta} for ${selected.length} items`);
    },
    [adjustStock],
  );

  const bulkSetStock = useCallback(async () => {
    const selected = gridApiRef.current?.api?.getSelectedRows() ?? [];
    if (!selected.length) {
      toast.info("No rows selected");
      return;
    }
    const raw = prompt("Set stock to (non-negative integer):", "0");
    if (raw === null) return;
    const value = Math.max(parseInt(raw, 10) || 0, 0);
    await Promise.all(
      selected.map((p) => commitPartUpdate({ ...p, stock: value } as Part)),
    );
    await queryClient.invalidateQueries(DBModel.getItemsQuery());
    toast.success(`Set stock=${value} for ${selected.length} items`);
  }, [commitPartUpdate]);

  const bulkSetMinStock = useCallback(async () => {
    const selected = gridApiRef.current?.api?.getSelectedRows() ?? [];
    if (!selected.length) {
      toast.info("No rows selected");
      return;
    }
    const raw = prompt("Set minimum stock to (non-negative integer):", "0");
    if (raw === null) return;
    const value = Math.max(parseInt(raw, 10) || 0, 0);
    await Promise.all(
      selected.map((p) =>
        commitPartUpdate({ ...p, minimum_stock: value } as Part),
      ),
    );
    await queryClient.invalidateQueries(DBModel.getItemsQuery());
    toast.success(`Set min stock=${value} for ${selected.length} items`);
  }, [commitPartUpdate]);

  const bulkToggleDisabled = useCallback(
    async (disabled: boolean) => {
      const selected = gridApiRef.current?.api?.getSelectedRows() ?? [];
      if (!selected.length) {
        toast.info("No rows selected");
        return;
      }
      await Promise.all(selected.map((p) => toggleDisabled(p, disabled)));
      await queryClient.invalidateQueries(DBModel.getItemsQuery());
      toast.success(
        `${disabled ? "Disabled" : "Enabled"} ${selected.length} items`,
      );
    },
    [toggleDisabled],
  );

  // Column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1.5,
      },
      {
        field: "standard_price",
        headerName: "Price",
        sortable: true,
        filter: true,
        flex: 0.6,
      },
      {
        field: "stock",
        headerName: "Stock",
        sortable: true,
        type: "editableColumn",
        flex: 0.45,
      },
      {
        headerName: "Adjust",
        colId: "stockAdjust",
        flex: 0.5,
        sortable: false,
        suppressMenu: true,
        cellRenderer: (params: ICellRendererParams<Part>) => {
          const part = params.data!;
          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Decrement stock">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustStock(part, -1);
                  }}
                >
                  <Remove fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Increment stock">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustStock(part, +1);
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
      {
        field: "minimum_stock",
        headerName: "Min Stock",
        sortable: true,
        flex: 0.5,
        type: "editableColumn",
      },
      {
        field: "upc",
        headerName: "UPC",
        sortable: true,
        filter: true,
        flex: 0.5,
      },
      {
        headerName: "Actions",
        colId: "actions",
        flex: 0.85,
        cellRenderer: (params: ICellRendererParams) => (
          <Stack direction="row">
            <Button
              variant="outlined"
              onClick={() => handleEdit(params.data)}
              size="small"
            >
              ✎
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDelete(params.data.item_id)}
              size="small"
            >
              🗑️
            </Button>
          </Stack>
        ),
      },
      {
        colId: "urgency",
        sortable: true,
        flex: 0.4,
        headerName: "Status",
        hide: true,
        cellRenderer: (params: ICellRendererParams) => {
          const stock = params.data.stock;
          const minStock = params.data.minimum_stock;
          const name = params.data.name;
          if (
            minStock === 0 ||
            name.includes("Retrospec") ||
            name.includes("Used") ||
            name.includes("used")
          ) {
            return <ThumbUp style={{ color: "green", marginRight: "5px" }} />;
          }
          if (stock < minStock) {
            return <ErrorSharp style={{ color: "red", marginRight: "5px" }} />;
          } else if (stock < minStock * 2) {
            return <Warning style={{ color: "orange", marginRight: "5px" }} />;
          } else {
            return <ThumbUp style={{ color: "green", marginRight: "5px" }} />;
          }
        },
        valueGetter: (params: ValueGetterParams) => {
          const stock = params.data.stock;
          const minStock = params.data.minimum_stock;
          const name = params.data.name;
          return getUrgency(stock, minStock, name);
        },
      },
    ],
    [adjustStock, handleDelete, handleEdit],
  );

  // External filter hooks
  const isExternalFilterPresent = useCallback(() => {
    return showOnlyLowStock || showOnlyDisabled;
  }, [showOnlyLowStock, showOnlyDisabled]);

  const doesExternalFilterPass = useCallback(
    (node: IRowNode<Part>) => {
      const p = node.data as Part;
      // Low stock == urgency 2 (warning) or 3 (error)
      const urgency = getUrgency(
        p.stock ?? 0,
        p.minimum_stock ?? 0,
        p.name ?? "",
      );
      const passesLow = !showOnlyLowStock || urgency >= 2;
      const passesDisabled = !showOnlyDisabled || Boolean(p.disabled);
      return passesLow && passesDisabled;
    },
    [showOnlyLowStock, showOnlyDisabled],
  );

  useEffect(() => {
    gridApiRef.current?.api?.setGridOption?.(
      "quickFilterText",
      quickFilterText,
    );
  }, [quickFilterText]);

  useEffect(() => {
    gridApiRef.current?.api?.onFilterChanged();
  }, [showOnlyLowStock, showOnlyDisabled]);

  

  return (
    <Box sx={{ padding: "2%" }}>
      <Typography variant="h3" align="center" gutterBottom>
        Items Management
      </Typography>

      {/* Toolbar row 1: filters + UPC activation + existing actions */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          <TextField
            size="small"
            placeholder="Quick search…"
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <MuiSwitch
                checked={showOnlyLowStock}
                onChange={(e) => setShowOnlyLowStock(e.target.checked)}
                color="warning"
              />
            }
            label="Only low stock"
          />
          <FormControlLabel
            control={
              <MuiSwitch
                checked={showOnlyDisabled}
                onChange={(e) => setShowOnlyDisabled(e.target.checked)}
                color="default"
              />
            }
            label="Only disabled"
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Activate by UPC"
              value={activateUpc}
              onChange={(e) => setActivateUpc(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                if (!activateUpc.trim()) {
                  toast.info("Enter a UPC to activate");
                  return;
                }
                activateByUpc.mutate(activateUpc.trim());
              }}
            >
              Activate UPC
            </Button>
            <Tooltip title="Reset filters">
              <IconButton onClick={handleResetFilters}>
                <RestartAlt />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={() => {
              setShowPriceCheckModal(true);
            }}
          >
            Check for Availability
          </Button>
          <PriceCheckModal
            open={showPriceCheckModal}
            onClose={() => {
              setShowPriceCheckModal(false);
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setDialogVisible(true);
            }}
          >
            Add Item
          </Button>
        </Stack>
      </Stack>

      {/* Toolbar row 2: bulk selection actions */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1, flexWrap: "wrap" }}
      >
        <Typography variant="subtitle2" sx={{ mr: 1 }}>
          Bulk actions on selected:
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Remove />}
          onClick={() => bulkAdjustStock(-1)}
        >
          -1
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => bulkAdjustStock(1)}
        >
          +1
        </Button>
        <Button variant="outlined" size="small" onClick={bulkSetStock}>
          Set Stock
        </Button>
        <Button variant="outlined" size="small" onClick={bulkSetMinStock}>
          Set Min
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => bulkToggleDisabled(false)}
        >
          Enable Selected
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => bulkToggleDisabled(true)}
        >
          Disable Selected
        </Button>
      </Stack>

      <Box sx={{ height: "70vh", width: "100%", overflow: "auto" }}>
        <AgGridReact<Part>
          loadingOverlayComponent={Skeleton}
          ref={gridApiRef}
          rowData={items}
          columnTypes={columnTypes}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, resizable: false }}
          pagination
          rowSelection="multiple"
          rowMultiSelectWithClick
          isExternalFilterPresent={isExternalFilterPresent}
          doesExternalFilterPass={doesExternalFilterPass}
          getRowStyle={({ data }) => {
            const part = data as Part;
            const urgency = getUrgency(
              part.stock ?? 0,
              part.minimum_stock ?? 0,
              part.name ?? "",
            );
            if (urgency == 3) {
              return { backgroundColor: "#F88379" };
            } else if (urgency == 2) {
              return { backgroundColor: "lightyellow" };
            } else if (urgency == 1) {
              return { backgroundColor: "lightgreen" };
            }
          }}
          onGridReady={() => {
            gridApiRef.current?.api?.applyColumnState({
              state: [{ colId: "urgency", sort: "desc" }],
              applyOrder: true,
            });
            // apply any initial quick filter if present
            if (quickFilterText) {
              gridApiRef.current?.api?.setGridOption?.(
                "quickFilterText",
                quickFilterText,
              );
            }
          }}
        />
      </Box>

      <ItemPageModal
        open={dialogVisible}
        onClose={handleCancel}
        item={selectedItem}
      />
    </Box>
  );
};

export default ItemsTable;
