import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Stack,
} from "@mui/material";
import DBModel, { Part } from "../model";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../app/queryClient";
import { toast } from "react-toastify";

interface ItemPageModalProps {
  open: boolean;
  onClose: () => void;
  item?: Part;
}

const ItemPageModal: React.FC<ItemPageModalProps> = ({
  open,
  onClose,
  item,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [edit, setEdit] = useState(item == null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);
  const [form, setForm] = useState({
    upc: item?.upc || "",
    name: item?.name || "",
    brand: item?.brand || "",
    description: item?.description || "",
    standard_price: `${item?.standard_price ?? "0"}`,
    wholesale_cost: `${item?.wholesale_cost ?? "0"}`,
    category_1: item?.category_1 || "",
    category_2: item?.category_2 || "",
    category_3: item?.category_3 || "",
    stock: item?.stock ?? 0,
    minimum_stock: item?.minimum_stock ?? 0,
  });

  // Removed snackbar state, using toast for notifications

  useEffect(() => {
    if (item) {
      setForm({
        upc: item.upc ?? "",
        name: item.name ?? "",
        brand: item.brand ?? "",
        description: item.description ?? "",
        standard_price: `${item.standard_price ?? "0"}`,
        wholesale_cost: `${item.wholesale_cost ?? "0"}`,
        category_1: item.category_1 ?? "",
        category_2: item.category_2 ?? "",
        category_3: item.category_3 ?? "",
        stock: item.stock ?? 0,
        minimum_stock: item.minimum_stock ?? 0,
      });
    }
  }, [item]);

  const { data: first_categories } = useQuery({
    queryKey: ["category", "1"],
    queryFn: () => DBModel.fetchItemCategory(1),
    select: (data) => data as string[],
  });
  const { data: second_categories } = useQuery({
    queryKey: ["category", "2"],
    queryFn: () => DBModel.fetchItemCategory(2),
    select: (data) => data as string[],
  });
  const { data: third_categories } = useQuery({
    queryKey: ["category", "3"],
    queryFn: () => DBModel.fetchItemCategory(3),
    select: (data) => data as string[],
  });

  const upsertItem = useMutation({
    mutationFn: (item: Part) => {
      setIsLoading(true);
      if (item.item_id) {
        return DBModel.updateItem(item);
      } else {
        if (item.upc) {
          return DBModel.createItem(item);
        } else {
          return Promise.reject(new Error("UPC is required for new items"));
        }
      }
    },
    onSuccess: () => {
      setIsLoading(false);
      toast.success("Item saved successfully");
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["category", "1"] });
      queryClient.invalidateQueries({ queryKey: ["category", "2"] });
      queryClient.invalidateQueries({ queryKey: ["category", "3"] });
      setEdit(false);
      onClose();
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(error?.message || "Error saving item");
      setEdit(true);
    },
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // List of fields that should be sanitized
    const numberFields = [
      "standard_price",
      "wholesale_cost",
      "stock",
      "minimum_stock",
    ];
    let sanitizedValue = value;
    if (numberFields.includes(name)) {
      // Remove leading zeros, but keep a single zero if that's the value
      sanitizedValue = value.replace(/^0+(?=\d)/, "");
      // If the field is empty, default to "0"
      if (sanitizedValue === "") sanitizedValue = "0";
    }
    setForm((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasBeenSubmitted(true);
    const standard_price_num = isNaN(Number.parseFloat(form.standard_price))
      ? 0
      : Number.parseFloat(form.standard_price);
    const wholesale_cost_num = isNaN(Number.parseFloat(form.wholesale_cost))
      ? 0
      : Number.parseFloat(form.wholesale_cost);

    if (
      !form.upc ||
      !form.name ||
      standard_price_num === 0 ||
      wholesale_cost_num === 0 ||
      wholesale_cost_num > standard_price_num ||
      form.stock < 0 ||
      form.minimum_stock < 0
    ) {
      toast.error("Please fill out all required fields correctly.");
      return;
    }
    const newItem: Part = {
      upc: form.upc ?? "",
      name: (form.name ?? "") || "",
      brand: form.brand,
      description: form.description,
      standard_price: standard_price_num || 0,
      wholesale_cost: wholesale_cost_num || 0,
      category_1: form.category_1,
      category_2: form.category_2,
      category_3: form.category_3,
      stock: form.stock ?? 0,
      minimum_stock: form.minimum_stock ?? 0,
      managed: true,
      condition: "new",
      disabled: false,
      specifications: {},
      features: [],
      item_id: item?.item_id ?? "",
    };
    upsertItem.mutate(newItem);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        aria-labelledby="item-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 6,
            bgcolor: "background.paper",
            px: { xs: 2, sm: 4 },
            py: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogTitle id="item-dialog-title" sx={{ pb: 0 }} component="div">
          <Typography
            variant="h5"
            component="h2"
            align="center"
            sx={{ fontWeight: 600 }}
          >
            Item Details
          </Typography>
        </DialogTitle>
        <Divider sx={{ mb: 2 }} />
        <DialogContent>
          {isLoading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ minHeight: 200 }}
            >
              <CircularProgress size={32} />
            </Stack>
          ) : edit ? (
            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="name"
                    label="Item Name"
                    required
                    error={hasBeenSubmitted && !form.name}
                    value={form.name}
                    onChange={handleFormChange}
                    fullWidth
                    autoFocus
                    inputProps={{ "aria-label": "Item Name" }}
                    variant="outlined"
                    size="medium"
                    helperText={
                      hasBeenSubmitted && !form.name ? "Name is required" : ""
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="brand"
                    label="Brand"
                    value={form.brand}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="Brand"
                    variant="outlined"
                    size="medium"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    disabled={!edit}
                    sx={{
                      height: { xs: "48px", sm: "56px" },
                      opacity: edit ? 1 : 0.5,
                      fontWeight: 500,
                      fontSize: "1rem",
                      mb: 1,
                    }}
                    variant="contained"
                    onClick={() => {
                      const newUpc = Math.floor(
                        Math.random() * 1000000000000,
                      ).toString();
                      setForm((prev) => ({
                        ...prev,
                        upc:
                          newUpc.length < 12
                            ? "0".repeat(12 - newUpc.length) + newUpc
                            : newUpc,
                      }));
                    }}
                    color="secondary"
                    aria-label="Generate UPC"
                  >
                    Generate UPC
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="upc"
                    label="UPC"
                    required
                    error={hasBeenSubmitted && !form.upc}
                    value={form.upc}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="UPC"
                    variant="outlined"
                    size="medium"
                    helperText={
                      hasBeenSubmitted && !form.upc
                        ? "UPC is required"
                        : "Generate for custom/used items"
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Description"
                    value={form.description}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="Description"
                    variant="outlined"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="standard_price"
                    label="Standard Price"
                    type="number"
                    inputProps={{ step: 0.01 }}
                    error={
                      hasBeenSubmitted &&
                      Number.parseFloat(form.standard_price) === 0
                    }
                    value={String(form.standard_price).replace(/^0+(?=\d)/, "")}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="Standard Price"
                    variant="outlined"
                    size="medium"
                    helperText={
                      hasBeenSubmitted &&
                        Number.parseFloat(form.standard_price) === 0
                        ? "Price is required"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="wholesale_cost"
                    label="Wholesale Cost"
                    type="number"
                    inputProps={{ step: 0.01 }}
                    error={
                      hasBeenSubmitted &&
                      Number.parseFloat(form.wholesale_cost) === 0
                    }
                    value={String(form.wholesale_cost).replace(/^0+(?=\d)/, "")}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="Wholesale Cost"
                    variant="outlined"
                    size="medium"
                    helperText={
                      hasBeenSubmitted &&
                        Number.parseFloat(form.wholesale_cost) === 0
                        ? "Wholesale cost is required"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="stock"
                    label="Stock"
                    type="number"
                    required
                    error={hasBeenSubmitted && form.stock < 0}
                    value={String(form.stock).replace(/^0+(?=\d)/, "")}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="Stock"
                    variant="outlined"
                    size="medium"
                    helperText={
                      hasBeenSubmitted && form.stock < 0
                        ? "Stock must be >= 0"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="minimum_stock"
                    label="Minimum Stock"
                    type="number"
                    required
                    error={hasBeenSubmitted && form.minimum_stock < 0}
                    value={String(form.minimum_stock).replace(/^0+(?=\d)/, "")}
                    onChange={handleFormChange}
                    fullWidth
                    aria-label="Minimum Stock"
                    variant="outlined"
                    size="medium"
                    helperText={
                      hasBeenSubmitted && form.minimum_stock < 0
                        ? "Minimum stock must be >= 0"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={first_categories || []}
                    value={form.category_1}
                    onChange={(_, value) =>
                      setForm((prev) => ({ ...prev, category_1: value ?? "" }))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="category_1"
                        label="Category 1"
                        fullWidth
                        aria-label="Category 1"
                        variant="outlined"
                        size="medium"
                      />
                    )}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={second_categories || []}
                    value={form.category_2}
                    onChange={(_, value) =>
                      setForm((prev) => ({ ...prev, category_2: value ?? "" }))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="category_2"
                        label="Category 2"
                        fullWidth
                        aria-label="Category 2"
                        variant="outlined"
                        size="medium"
                      />
                    )}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={third_categories || []}
                    value={form.category_3}
                    onChange={(_, value) =>
                      setForm((prev) => ({ ...prev, category_3: value ?? "" }))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="category_3"
                        label="Category 3"
                        fullWidth
                        aria-label="Category 3"
                        variant="outlined"
                        size="medium"
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ justifyContent: "flex-end" }}
              >
                <Button
                  onClick={onClose}
                  color="primary"
                  variant="outlined"
                  fullWidth={isMobile}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  disabled={isLoading}
                  fullWidth={isMobile}
                  sx={{ fontWeight: 600 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "Save"}
                </Button>
              </Stack>
            </form>
          ) : (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                {form.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                UPC: {form.upc}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Brand: {form.brand}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Description: {form.description}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Price: ${form.standard_price}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Wholesale Cost: ${form.wholesale_cost}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Stock: {form.stock}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Min Stock: {form.minimum_stock}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ justifyContent: "flex-end" }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setEdit(true)}
                  aria-label="Edit Item"
                  fullWidth={isMobile}
                  sx={{ fontWeight: 600 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onClose}
                  aria-label="Close"
                  fullWidth={isMobile}
                >
                  Close
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemPageModal;
