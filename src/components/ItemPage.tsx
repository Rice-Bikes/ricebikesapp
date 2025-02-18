import React from 'react';
import { Modal, Box, Typography, Grid2 } from '@mui/material';
import { ItemDetails } from '../model';

interface ItemPageModalProps {
    open: boolean;
    onClose: () => void;
    item: ItemDetails;
}

const ItemPageModal: React.FC<ItemPageModalProps> = ({ open, onClose, item }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, maxWidth: 600, mx: 'auto', mt: '10%' }}>
                <Typography variant="h6" gutterBottom>
                    Item Details
                </Typography>
                <Grid2 container spacing={2}>
                    {Object.entries(item).map(([key, value]) => (
                        <Grid2  key={key}>
                            <Typography variant="subtitle2">{key.replace(/_/g, ' ')}</Typography>
                            <Typography variant="body2">{JSON.stringify(value)}</Typography>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        </Modal>
    );
};

export default ItemPageModal;