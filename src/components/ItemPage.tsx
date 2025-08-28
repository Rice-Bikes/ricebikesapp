import React, { useEffect, useState } from 'react';
import { Dialog, Box, Typography, Grid2, TextField, Button, CircularProgress, Autocomplete } from '@mui/material';
import DBModel, { Part } from '../model'
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { queryClient } from '../app/queryClient';

interface ItemPageModalProps {
    open: boolean;
    onClose: () => void;
    item?: Part;
}

const ItemPageModal: React.FC<ItemPageModalProps> = ({ open, onClose, item }) => {
    const [edit, setEdit] = useState(item === null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);
    const [form, setForm] = useState({
        upc: item?.upc || '',
        name: item?.name || '',
        brand: item?.brand || '',
        description: item?.description || '',
        standard_price: `${item?.standard_price ?? "0"}`,
        wholesale_cost: `${item?.wholesale_cost ?? "0"}`,
        category_1: item?.category_1 || '',
        category_2: item?.category_2 || '',
        category_3: item?.category_3 || '',
        stock: item?.stock ?? 0,
        minimum_stock: item?.minimum_stock ?? 0,
    });

    useEffect(() => {
        if (item) {
            setForm({
                upc: item.upc ?? '',
                name: item.name ?? '',
                brand: item.brand ?? '',
                description: item.description ?? '',
                standard_price: `${item.standard_price ?? "0"}`,
                wholesale_cost: `${item.wholesale_cost ?? "0"}`,
                category_1: item.category_1 ?? '',
                category_2: item.category_2 ?? '',
                category_3: item.category_3 ?? '',
                stock: item.stock ?? 0,
                minimum_stock: item.minimum_stock ?? 0,
            });
        }
    }, [item]);

    const { data: first_categories } = useQuery({
        queryKey: ['category', '1'],
        queryFn: () => DBModel.fetchItemCategory(1),
        select: (data) => data as string[],
    });
    const { data: second_categories } = useQuery({
        queryKey: ['category', '2'],
        queryFn: () => DBModel.fetchItemCategory(2),
        select: (data) => data as string[],
    });
    const { data: third_categories } = useQuery({
        queryKey: ['category', '3'],
        queryFn: () => DBModel.fetchItemCategory(3),
        select: (data) => data as string[],
    });

    const upsertItem = useMutation({
        mutationFn: (item: Part) => {
            setIsLoading(true);
            if (item.item_id) {
                return DBModel.updateItem(item);
            } else {
                if (item.upc && item.upc !== null) {
                    return DBModel.createItem(item);
                } else {
                    return Promise.reject(new Error("UPC is required for new items"));
                }
            }
        },
        onSuccess: () => {
            setIsLoading(false);
            toast.success("Item saved successfully");
            queryClient.invalidateQueries({ queryKey: ['items'] });
            queryClient.invalidateQueries({ queryKey: ['category', '1'] });
            queryClient.invalidateQueries({ queryKey: ['category', '2'] });
            queryClient.invalidateQueries({ queryKey: ['category', '3'] });
            setEdit(false);
            onClose();
        },
        onError: () => {
            setIsLoading(false);
            toast.error("Error saving item");
            setEdit(true);
        },
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setHasBeenSubmitted(true);
        const standard_price_num = isNaN(Number.parseFloat(form.standard_price)) ? 0 : Number.parseFloat(form.standard_price);
        const wholesale_cost_num = isNaN(Number.parseFloat(form.wholesale_cost)) ? 0 : Number.parseFloat(form.wholesale_cost);
        if (isNaN(standard_price_num)) {
            toast.error("Standard Price must be a number");
            return;
        }
        if (isNaN(wholesale_cost_num)) {
            toast.error("Wholesale Cost must be a number");
            return;
        }
        if (wholesale_cost_num > standard_price_num) {
            toast.error("Wholesale Cost must be less than or equal to Standard Price");
            return;
        }
        if (isNaN(form.stock)) {
            toast.error("Stock must be a number");
            return;
        }
        if (isNaN(form.minimum_stock)) {
            toast.error("Minimum Stock must be a number");
            return;
        }
        if (!form.upc || !form.name || standard_price_num === 0 || wholesale_cost_num === 0 || wholesale_cost_num > standard_price_num || form.stock < 0 || form.minimum_stock < 0) {
            toast.error(`Please fill out all required fields: ${!form.upc ? 'UPC, ' : ''}${!form.name ? 'Name, ' : ''}${standard_price_num === 0 ? 'Standard Price, ' : ''}${wholesale_cost_num === 0 || wholesale_cost_num > standard_price_num ? 'Wholesale Cost, ' : ''}${form.stock < 0 ? 'Stock, ' : ''}${form.minimum_stock < 0 ? 'Minimum Stock, ' : ''}`.slice(0, -2));
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
        <Dialog open={open} onClose={onClose}>
            <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, maxWidth: 600, mx: 'auto', mt: '-10px', textAlign: 'center', textJustify: 'center' }}>
                <Typography variant="h6" gutterBottom>
                    Item Details
                </Typography>
                {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : edit ? (
                    <form onSubmit={handleSubmit}>
                        <Grid2 container spacing={2}>
                            <Grid2 size={12}>
                                <TextField
                                    name="name"
                                    label="Name"
                                    type="text"
                                    required
                                    error={hasBeenSubmitted && !form.name}
                                    value={form.name}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="upc"
                                    label="UPC"
                                    type="text"
                                    required
                                    helperText="Generate for custom/used items"
                                    error={hasBeenSubmitted && !form.upc}
                                    value={form.upc}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <Button
                                    fullWidth
                                    disabled={!edit}
                                    sx={{ height: "60%", marginTop: "10%", opacity: edit ? 1 : 0.5 }}
                                    variant="contained"
                                    onClick={() => {
                                        const newUpc = Math.floor(Math.random() * 1000000000000).toString();
                                        setForm((prev) => ({
                                            ...prev,
                                            upc: newUpc.length < 12 ? "0".repeat(12 - newUpc.length) + newUpc : newUpc,
                                        }));
                                    }}
                                    color="secondary"
                                >
                                    Generate UPC
                                </Button>
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="brand"
                                    label="Brand"
                                    type="text"
                                    value={form.brand}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="description"
                                    label="Description"
                                    type="text"
                                    value={form.description}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="standard_price"
                                    label="Price"
                                    type="number"
                                    inputProps={{ step: 0.01 }}
                                    error={hasBeenSubmitted && Number.parseFloat(form.standard_price) === 0}
                                    value={form.standard_price}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="wholesale_cost"
                                    label="Wholesale Cost"
                                    type="number"
                                    inputProps={{ step: 0.01 }}
                                    error={hasBeenSubmitted && Number.parseFloat(form.wholesale_cost) === 0}
                                    value={form.wholesale_cost}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="stock"
                                    label="Stock"
                                    type="number"
                                    required
                                    error={hasBeenSubmitted && form.stock < 0}
                                    value={form.stock}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={6}>
                                <TextField
                                    name="minimum_stock"
                                    label="Min Stock"
                                    type="number"
                                    required
                                    error={hasBeenSubmitted && form.minimum_stock < 0}
                                    value={form.minimum_stock}
                                    onChange={handleFormChange}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={4}>
                                <Autocomplete
                                    options={first_categories || []}
                                    value={form.category_1}
                                    onChange={(_, value) => setForm((prev) => ({ ...prev, category_1: value ?? '' }))}
                                    renderInput={(params) => (
                                        <TextField {...params} name="category_1" label="Category 1" />
                                    )}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={4}>
                                <Autocomplete
                                    options={second_categories || []}
                                    value={form.category_2}
                                    onChange={(_, value) => setForm((prev) => ({ ...prev, category_2: value ?? '' }))}
                                    renderInput={(params) => (
                                        <TextField {...params} name="category_2" label="Category 2" />
                                    )}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={4}>
                                <Autocomplete
                                    options={third_categories || []}
                                    value={form.category_3}
                                    onChange={(_, value) => setForm((prev) => ({ ...prev, category_3: value ?? '' }))}
                                    renderInput={(params) => (
                                        <TextField {...params} name="category_3" label="Category 3" />
                                    )}
                                    fullWidth
                                />
                            </Grid2>
                            <Grid2 size={8}></Grid2>
                            <Grid2 size={4}>
                                <Button
                                    fullWidth
                                    sx={{ height: "80%", marginTop: "10%" }}
                                    variant={edit ? "contained" : "outlined"}
                                    type={edit ? "submit" : "button"}
                                    onClick={() => {
                                        if (!edit) setEdit(true);
                                    }}
                                    color="primary"
                                >
                                    {!edit ? "Open for Edit" : "Submit Item"}
                                </Button>
                            </Grid2>
                        </Grid2>
                    </form>
                ) : (
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            {form.name}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {form.upc}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {form.brand}
                        </Typography>
                        <Button
                            fullWidth
                            sx={{ height: "80%", marginTop: "10%" }}
                            variant="contained"
                            onClick={() => setEdit(true)}
                            color="primary"
                        >
                            Open for Edit
                        </Button>
                    </Box>
                )}
            </Box>
        </Dialog>
    );
};

export default ItemPageModal;