import React, { useState } from 'react';
import { Modal, Box, Typography, Grid2, TextField, Button, CircularProgress } from '@mui/material';
import DBModel, { Part } from '../model'
import { useMutation } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';

interface ItemPageModalProps {
    open: boolean;
    onClose: () => void;
    item?: Part;
}

const ItemPageModal: React.FC<ItemPageModalProps> = ({ open, onClose, item }) => {
    // if (!item) return};
    const [edit, setEdit] = useState(item === undefined);
    const [isLoading, setIsLoading] = useState(false);

    const [upc, setUpc] = useState<string>(item?.upc || '');
    const [name, setName] = useState<string>(item?.name || '');
    const [brand, setBrand] = useState<string>(item?.brand || '');
    const [description, setDescription] = useState<string>(item?.description || '');
    const [standard_price, setStandardPrice] = useState<number>(item?.standard_price || 0);
    const [wholesale_cost, setWholesaleCost] = useState<number>(item?.wholesale_cost || 0);
    const [category_1, setCategory1] = useState<string>(item?.category_1 || '');
    const [category_2, setCategory2] = useState<string>(item?.category_2 || '');
    const [category_3, setCategory3] = useState<string>(item?.category_3 || '');
    const [stock, setStock] = useState<number>(item?.stock || 0);
    const [minimum_stock, setMinimumStock] = useState<number>(item?.minimum_stock || 0);

    const handleSubmit = () => {
        const newItem: Part = {
            upc,
            name,
            brand,
            description,
            standard_price,
            wholesale_cost,
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
            onClose();
        },
        onError: (error) => {
            console.error("Error creating item", error);
            setIsLoading(false);
            toast.error("Error creating item");
        }
    });
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, maxWidth: 600, mx: 'auto', mt: '10%', textAlign: 'center', textJustify: 'center' }}>
                <ToastContainer />

                <Typography variant="h6" gutterBottom>
                    Item Details
                </Typography>
                {isLoading ?
                    <CircularProgress size={24} color='inherit' />
                    : (<Grid2 container spacing={2}>
                        <>
                            <Grid2 size={4}>
                                <Typography variant="body1">Name:</Typography>
                                {edit ? <TextField type="text" value={name} onChange={(e) => setName(e.target.value)} required /> :
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

                            <Grid2 size={4}>
                                <Typography variant="body1">UPC:</Typography>
                                {edit ? <TextField type="text" helperText="Generate for custom/used items" value={upc} onChange={(e) => setUpc(e.target.value)} required /> :
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
                            <Grid2 size={4}>
                                <Button
                                    fullWidth
                                    disabled={!edit}
                                    sx={{ height: "60%", marginTop: "10%", opacity: edit ? 1 : 0.5 }}
                                    variant="contained"
                                    onClick={() => {
                                        const newUpc = Math.floor(Math.random() * 1000000000000).toString();
                                        if (newUpc.length !== 12) {
                                            setUpc("0".repeat(12 - newUpc.length - 1) + newUpc);
                                        }
                                        setUpc(newUpc);
                                    }}
                                    color="secondary"
                                >
                                    Generate UPC
                                </Button>
                            </Grid2>

                            <Grid2 size={4}>
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
                            <Grid2 size={4}>
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
                            <Grid2 size={4}>
                                <Typography variant="body1">Stock:</Typography>
                                {edit ? <TextField type="number" value={stock} onChange={(e) => setStock(Number.parseInt(e.target.value))} required /> :
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
                            <Grid2 size={4}>
                                <Typography variant="body1">Min Stock:</Typography>
                                {edit ? <TextField type="number" value={minimum_stock} onChange={(e) => setMinimumStock(Number.parseInt(e.target.value))} /> :
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
                                <Typography variant="body1">Price:</Typography>
                                {edit ? <TextField type="number" value={standard_price} onChange={(e) => setStandardPrice(Number.parseInt(e.target.value))} required={standard_price > 0} /> :
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
                                    >{standard_price}</Button>}
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Wholesale Cost:</Typography>
                                {edit ? <TextField type="number" value={wholesale_cost} onChange={(e) => setWholesaleCost(Number.parseInt(e.target.value))} required={wholesale_cost > 0} /> :
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
                                    >{wholesale_cost}</Button>}
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Category 1:</Typography>
                                {edit ? <TextField type="text" value={category_1} onChange={(e) => setCategory1(e.target.value)} /> :
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
                                    >{category_1}</Button>}
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Category 2:</Typography>
                                {edit ? <TextField type="text" value={category_2} onChange={(e) => setCategory2(e.target.value)} /> : <Typography variant="body1">{category_2}</Typography>}
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Category 3:</Typography>
                                {edit ? <TextField type="text" value={category_3} onChange={(e) => setCategory3(e.target.value)} /> :
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
                                    >{category_3}</Button>}
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
                                        setEdit(!edit);
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
        </Modal>
    );
};

export default ItemPageModal;