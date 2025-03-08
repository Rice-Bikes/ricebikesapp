import React, { useEffect, useState } from 'react';
import { createFilterOptions, Dialog, Box, Typography, Grid2, TextField, Button, CircularProgress, Autocomplete } from '@mui/material';
import DBModel, { Part } from '../model'
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { queryClient } from '../app/main';

interface ItemPageModalProps {
    open: boolean;
    onClose: () => void;
    item?: Part;
}
const filter = createFilterOptions<string>();
const ItemPageModal: React.FC<ItemPageModalProps> = ({ open, onClose, item }) => {
    // if (!item) return};
    console.log(item ? false : true);
    const [edit, setEdit] = useState(item === undefined);
    console.log(edit);
    console.log("item", item);
    const [isLoading, setIsLoading] = useState(false);
    const [hasBeenSubmitted, setHasBeenSubmitted] = useState(false);
    const [upc, setUpc] = useState<string>(item?.upc || '');
    const [name, setName] = useState<string>(item?.name || '');
    const [brand, setBrand] = useState<string>(item?.brand || '');
    const [description, setDescription] = useState<string>(item?.description || '');
    const [standard_price, setStandardPrice] = useState<string>(`${item?.standard_price}` || "0");
    const [wholesale_cost, setWholesaleCost] = useState<string>(`${item?.wholesale_cost}` || "0");
    const [category_1, setCategory1] = useState<string>(item?.category_1 || '');
    const [category_2, setCategory2] = useState<string>(item?.category_2 || '');
    const [category_3, setCategory3] = useState<string>(item?.category_3 || '');
    const [stock, setStock] = useState<number>(item?.stock || 0);
    const [minimum_stock, setMinimumStock] = useState<number>(item?.minimum_stock || 0);

    useEffect(() => {
        if (item) {
            setUpc(item.upc);
            setName(item.name);
            setBrand(item.brand ?? '');
            setDescription(item.description ?? '');
            setStandardPrice(`${item.standard_price}`);
            setWholesaleCost(`${item.wholesale_cost}`);
            setCategory1(item.category_1 ?? '');
            setCategory2(item.category_2 ?? '');
            setCategory3(item.category_3 ?? '');
            setStock(item.stock ?? 0);
            setMinimumStock(item.minimum_stock ?? 0);
        }

    }, [item]);

    const { data: first_categories } = useQuery({
        queryKey: ['category', '1'],
        queryFn: () => DBModel.fetchItemCategory(1),
        select: (data) => data as string[]
    });

    const { data: second_categories } = useQuery({
        queryKey: ['category', '2'],
        queryFn: () => DBModel.fetchItemCategory(2),
        select: (data) => data as string[]
    });

    const { data: third_categories } = useQuery({
        queryKey: ['category', '3'],
        queryFn: () => DBModel.fetchItemCategory(3),
        select: (data) => data as string[]
    });



    const handleSubmit = () => {
        setHasBeenSubmitted(true);
        if (isNaN(Number.parseFloat(standard_price))) {
            toast.error("Standard Price must be a number");
            return;
        }
        if (isNaN(Number.parseFloat(wholesale_cost))) {
            toast.error("Wholesale Cost must be a number");
            return
        }

        const wholesale_cost_num = Number.parseFloat(wholesale_cost);
        const standard_price_num = Number.parseFloat(standard_price);
        if (wholesale_cost_num > standard_price_num) {
            toast.error("Wholesale Cost must be less than or equal to Standard Price");
            return;
        }
        if (isNaN(stock)) {
            toast.error("Stock must be a number");
            return;
        }
        if (isNaN(minimum_stock)) {
            toast.error("Minimum Stock must be a number");
            return;
        }

        if (!upc || upc.length != 12 || !name || standard_price_num == 0 || wholesale_cost_num == 0 || wholesale_cost_num > standard_price_num || stock < 0 || minimum_stock < 0) {
            toast.error(`Please fill out all required fields: ${!upc ? 'UPC, ' : ''}${!name ? 'Name, ' : ''}${standard_price_num == 0 ? 'Standard Price, ' : ''}${wholesale_cost_num == 0 || wholesale_cost_num > standard_price_num ? 'Wholesale Cost, ' : ''}${stock < 0 ? 'Stock, ' : ''}${minimum_stock < 0 ? 'Minimum Stock, ' : ''}`.slice(0, -2));
            return;
        }
        const newItem: Part = {
            upc,
            name,
            brand,
            description,
            standard_price: standard_price_num,
            wholesale_cost: wholesale_cost_num,
            category_1,
            category_2,
            category_3,
            stock,
            minimum_stock,
            managed: true,
            condition: "new",
            disabled: false,
            specifications: {},
            features: [],
            item_id: "",
        };

        upsertItem.mutate(newItem);
    }

    const upsertItem = useMutation({
        mutationFn: (item: Part) => {
            setIsLoading(true);
            return DBModel.createItem(item);
        },
        onSuccess: (data) => {
            setIsLoading(false);
            console.log("Item created successfully", data);
            toast.success("Item created successfully");
            queryClient.invalidateQueries({ queryKey: ['items'] });
            queryClient.invalidateQueries({ queryKey: ['category', '1'] });
            queryClient.invalidateQueries({ queryKey: ['category', '2'] });
            queryClient.invalidateQueries({ queryKey: ['category', '3'] });
            setEdit(false);
            onClose();
        },
        onError: (error) => {
            console.error("Error creating item", error);
            setIsLoading(false);
            toast.error("Error creating item");
            setEdit(true);
        }
    });
    return (
        <Dialog open={open} onClose={onClose}>
            <Box component="form" sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, maxWidth: 600, mx: 'auto', mt: '-10px', textAlign: 'center', textJustify: 'center' }}>

                <Typography variant="h6" gutterBottom>
                    Item Details
                </Typography>
                {isLoading ?
                    <CircularProgress size={24} color='inherit' />
                    : (<Grid2 container spacing={2}>
                        <>
                            <Grid2 size={12}>
                                <Typography variant="body1">Name:</Typography>
                                {edit ? <TextField name="name" type="text" error={hasBeenSubmitted && !name} required value={name} onChange={(e) => setName(e.target.value)} /> :
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: "black",
                                            backgroundColor: "white",
                                            borderColor: "white",
                                            pointerEvents: "none",
                                        }}
                                        fullWidth
                                        style={{ height: "80%" }}
                                    >{name}</Button>}
                            </Grid2>

                            <Grid2 size={6}>
                                <Typography variant="body1">UPC:</Typography>
                                {edit ? <TextField type="text" helperText="Generate for custom/used items" error={hasBeenSubmitted && (!upc || upc.length !== 12)} value={upc} onChange={(e) => setUpc(e.target.value)} required /> :
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: "black",
                                            backgroundColor: "white",
                                            borderColor: "white",
                                            pointerEvents: "none",
                                        }}
                                        fullWidth
                                        style={{ height: "80%" }}
                                    >{upc}</Button>}
                            </Grid2>
                            <Grid2 size={6}>
                                <Button
                                    fullWidth
                                    disabled={!edit}
                                    sx={{ height: "60%", marginTop: "10%", opacity: edit ? 1 : 0.5 }}
                                    variant="contained"
                                    onClick={() => {
                                        const newUpc = Math.floor(Math.random() * 1000000000000).toString();
                                        if (newUpc.length < 12) {
                                            setUpc("0".repeat(12 - newUpc.length) + newUpc);
                                        }
                                        else {
                                            setUpc(newUpc);
                                        }
                                    }}
                                    color="secondary"
                                >
                                    Generate UPC
                                </Button>
                            </Grid2>

                            <Grid2 size={6}>
                                <Typography variant="body1">Brand:</Typography>
                                {edit ? <TextField type="text" value={brand} onChange={(e) => setBrand(e.target.value)} /> :
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: "black",
                                            backgroundColor: "white",
                                            borderColor: "white",
                                            pointerEvents: "none",
                                        }}
                                        fullWidth
                                        style={{ height: "80%" }}
                                    >{brand}</Button>}
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body1">Description:</Typography>
                                {edit ? <TextField type="text" value={description} onChange={(e) => setDescription(e.target.value)} /> :
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: "black",
                                            backgroundColor: "white",
                                            borderColor: "white",
                                            pointerEvents: "none",
                                        }}
                                        fullWidth
                                        style={{ height: "80%" }}
                                    >{description}</Button>}
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body1">Price:</Typography>
                                {edit ? <TextField type="number" slotProps={{ "htmlInput": { step: 0.01 } }} error={hasBeenSubmitted && Number.parseFloat(standard_price) === 0} value={standard_price} onChange={(e) => setStandardPrice(e.target.value)} />
                                    : <Button variant="outlined" fullWidth style={{ height: "80%" }} sx={{ color: "black", backgroundColor: "white", borderColor: "white", pointerEvents: "none" }}>{standard_price}</Button>}
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body1">Wholesale Cost:</Typography>
                                {edit ? <TextField type="number" slotProps={{ "htmlInput": { step: 0.01 } }} value={wholesale_cost} error={hasBeenSubmitted && Number.parseFloat(wholesale_cost) === 0} onChange={(e) => setWholesaleCost(e.target.value)} />
                                    : <Button variant="outlined" sx={{ color: "black", backgroundColor: "white", borderColor: "white", pointerEvents: "none", }} fullWidth style={{ height: "80%" }}>{wholesale_cost}</Button>}
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body1">Stock:</Typography>
                                {edit ? <TextField type="number" error={hasBeenSubmitted && stock < 0} value={stock} onChange={(e) => setStock(Number.parseInt(e.target.value))} required /> :
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: "black",
                                            backgroundColor: "white",
                                            borderColor: "white",
                                            pointerEvents: "none",
                                        }}
                                        fullWidth
                                        style={{ height: "80%" }}
                                    >{stock}</Button>}
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body1">Min Stock:</Typography>
                                {edit ? <TextField type="number" required error={hasBeenSubmitted && minimum_stock < 0} value={minimum_stock} onChange={(e) => setMinimumStock(Number.parseInt(e.target.value))} /> :
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            color: "black",
                                            backgroundColor: "white",
                                            borderColor: "white",
                                            pointerEvents: "none",
                                        }}
                                        fullWidth
                                        style={{ height: "80%" }}
                                    >{minimum_stock}</Button>}
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography variant="body1">Category 1:</Typography>
                                {edit && first_categories ?
                                    <Autocomplete
                                        renderInput={(params) => (
                                            <TextField {...params} type="text" name="category1" onChange={(e) => setCategory1(e.target.value)} value={category_1} />)}
                                        options={first_categories}
                                        onChange={(_, value, reason) => {
                                            if (reason === "selectOption" && first_categories) {
                                                const first_category = first_categories.find(
                                                    (second_category) => second_category === value
                                                );
                                                if (first_category) {
                                                    setCategory1(
                                                        first_category
                                                    );
                                                }
                                            }
                                            else {
                                                setCategory1(value ?? "");
                                            }
                                        }
                                        }
                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);

                                            const { inputValue } = params;
                                            // Suggest the creation of a new value
                                            const isExisting = options.some((option) => inputValue === option);
                                            if (inputValue !== '' && !isExisting) {
                                                filtered.push(`${inputValue}`);
                                            }

                                            return filtered;
                                        }
                                        }
                                        fullWidth
                                    />
                                    : <Button variant="outlined" sx={{ color: "black", backgroundColor: "white", borderColor: "white", pointerEvents: "none", }} fullWidth style={{ height: "80%" }} >{category_1}</Button>
                                }
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Category 2:</Typography>
                                {edit && second_categories ?
                                    <Autocomplete
                                        renderInput={(params) => (
                                            <TextField {...params} type="text" name="category2" onChange={(e) => setCategory2(e.target.value)} value={category_2} />)}
                                        options={second_categories}
                                        onChange={(_, value, reason) => {
                                            if (reason === "selectOption" && second_categories) {
                                                const second_category = second_categories.find(
                                                    (second_category) => second_category === value
                                                );
                                                if (second_category) {
                                                    setCategory2(
                                                        second_category
                                                    );
                                                }
                                            }
                                            else {
                                                setCategory2(value ?? "");
                                            }
                                        }
                                        }
                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);

                                            const { inputValue } = params;
                                            // Suggest the creation of a new value
                                            const isExisting = options.some((option) => inputValue === option);
                                            if (inputValue !== '' && !isExisting) {
                                                filtered.push(`${inputValue}`);
                                            }

                                            return filtered;
                                        }
                                        }
                                        fullWidth
                                    />
                                    : <Button variant="outlined" sx={{ color: "black", backgroundColor: "white", borderColor: "white", pointerEvents: "none", }} fullWidth style={{ height: "80%" }} >{category_2}</Button>
                                }
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Category 3:</Typography>
                                {edit && third_categories ?
                                    <Autocomplete
                                        renderInput={(params) => (
                                            <TextField {...params} type="text" name="category3" onChange={(e) => setCategory3(e.target.value)} value={category_3} />)}
                                        options={third_categories}
                                        onChange={(_, value, reason) => {
                                            if (reason === "selectOption" && third_categories) {
                                                const third_category = third_categories.find(
                                                    (third_category) => third_category === value
                                                );
                                                if (third_category) {
                                                    setCategory3(
                                                        third_category
                                                    );
                                                }
                                            }
                                            else {
                                                setCategory3(value ?? "");
                                            }
                                        }
                                        }
                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);

                                            const { inputValue } = params;
                                            // Suggest the creation of a new value
                                            const isExisting = options.some((option) => inputValue === option);
                                            if (inputValue !== '' && !isExisting) {
                                                filtered.push(`${inputValue}`);
                                            }

                                            return filtered;
                                        }
                                        }
                                        fullWidth
                                    />
                                    : <Button variant="outlined" sx={{ color: "black", backgroundColor: "white", borderColor: "white", pointerEvents: "none", }} fullWidth style={{ height: "80%" }} >{category_3}</Button>
                                }
                            </Grid2>
                            <Grid2 size={8}>
                            </Grid2>
                            <Grid2 size={4}>
                                <Button
                                    fullWidth
                                    sx={{ height: "80%", marginTop: "10%" }}
                                    variant={edit ? "contained" : "outlined"}
                                    onClick={() => {
                                        if (edit) {
                                            handleSubmit();
                                        }
                                        else {
                                            setEdit(true);
                                        }
                                        // setEdit(!edit);
                                    }}
                                    color="primary"
                                >
                                    {!edit ? "Open for Edit" : "Submit Item"}
                                </Button>
                            </Grid2>
                        </>
                    </Grid2>)
                }
            </Box>
        </Dialog>
    );
};

export default ItemPageModal;