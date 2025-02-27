import React from 'react';
import { Modal, Box, Typography, Grid2, TextField } from '@mui/material';
import { Part } from '../model';

interface ItemPageModalProps {
    open: boolean;
    onClose: () => void;
    item?: Part;
}

const ItemPageModal: React.FC<ItemPageModalProps> = ({ open, onClose, item }) => {
    // if (!item) return};
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, maxWidth: 600, mx: 'auto', mt: '10%' }}>
                <Typography variant="h6" gutterBottom>
                    Item Details
                </Typography>
                <Grid2 container spacing={2}>
                    {item ? (
                        <>
                            <Grid2 size={4}>
                                <Typography variant="body1">Name:</Typography>
                                <TextField type="text" value={item.name || 'N/A'} onChange={(e) => item.name = e.target.value} />
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">UPC:</Typography>
                                <TextField type="text" value={item.upc} onChange={(e) => item.upc = e.target.value} />
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Brand:</Typography>
                                <TextField type="text" value={item.brand || 'N/A'} onChange={(e) => item.brand = e.target.value} />
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Description:</Typography>
                                <TextField type="text" value={item.description || 'N/A'} onChange={(e) => item.description = e.target.value} />
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Price:</Typography>
                                <TextField type="number" value={item.standard_price || 'N/A'} onChange={(e) => item.standard_price = Number.parseInt(e.target.value)} />
                            </Grid2>
                            <Grid2 size={4}>
                                <Typography variant="body1">Category:</Typography>
                                <TextField type="text" value={`${item.category_1}/${item.category_2}/${item.category_3}`} onChange={(e) => {
                                    const categories = e.target.value.split('/');
                                    item.category_1 = categories[0];
                                    item.category_2 = categories[1];
                                    item.category_3 = categories[2];
                                }} />
                            </Grid2>
                        </>
                    ) : (
                        <Typography variant="body2">No item details available.</Typography>
                    )}
                </Grid2>
            </Box>
        </Modal>
    );
};

export default ItemPageModal;