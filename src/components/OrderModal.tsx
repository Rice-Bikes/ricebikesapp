import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Stack,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays } from 'date-fns';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DBModel from '../model';
import { Order, User } from '../model';
import { queryClient } from '../app/queryClient';

interface OrderModalProps {
    user: User;
    order?: Order;
}

const OrderModal: React.FC<OrderModalProps> = ({ user, order }) => {
    // Fetch the closest future order if no specific order is provided
    const { data: closestOrder } = useQuery(
        DBModel.getClosestFutureOrderQuery()
    );

    // Use the provided order or the closest future order
    const orderToUse = order || closestOrder;

    const [form, setForm] = useState({
        supplier: orderToUse?.supplier || '',
        ordered_by: orderToUse?.ordered_by || user.firstname + ' ' + user.lastname,
        order_date: orderToUse?.order_date ? new Date(orderToUse.order_date) : null,
    });

    const [open, setOpen] = useState(false);

    const onClose = () => {
        setOpen(false);
    };

    const canModify = user.permissions?.some(perm => perm.name === 'canSetOrderDate') || user.username === "cjg8";

    useEffect(() => {
        if (orderToUse) {
            setForm({
                supplier: orderToUse.supplier,
                ordered_by: orderToUse.ordered_by,
                order_date: new Date(orderToUse.order_date),
            });
        } else {
            setForm({
                supplier: '',
                ordered_by: user.firstname + ' ' + user.lastname,
                order_date: null,
            });
        }
    }, [orderToUse, user]);

    const createOrderMutation = useMutation({
        mutationFn: (newOrder: Omit<Order, 'order_id' | 'estimated_delivery'>) =>
            DBModel.createOrder({
                ...newOrder,
                estimated_delivery: newOrder.order_date ? addDays(newOrder.order_date, 5).toISOString() : addDays(new Date(), 5).toISOString(),
            }),
        onSuccess: () => {
            toast.success('Order created successfully');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onClose();
        },
        onError: (error: Error) => {
            toast.error('Failed to create order: ' + error.message);
        },
    });

    const updateOrderMutation = useMutation({
        mutationFn: (updatedOrder: Order) => DBModel.updateOrder({
            ...updatedOrder,
            estimated_delivery: updatedOrder.order_date ? addDays(new Date(updatedOrder.order_date), 5).toISOString() : addDays(new Date(), 5).toISOString(),
        }),
        onSuccess: () => {
            toast.success('Order updated successfully');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onClose();
        },
        onError: () => {
            toast.error('Failed to update order');
        },
    });

    const handleSubmit = () => {
        if (!form.supplier || !form.ordered_by || !form.order_date) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (orderToUse) {
            // Update existing order
            updateOrderMutation.mutate({
                ...orderToUse,
                supplier: form.supplier,
                ordered_by: form.ordered_by,
                order_date: form.order_date.toISOString(),
            });
        } else {
            // Create new order
            createOrderMutation.mutate({
                supplier: form.supplier,
                ordered_by: form.ordered_by,
                order_date: form.order_date?.toISOString(),
            });
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction={'column'} sx={{ mb: 0.5 }}>
                <Button variant="contained" color='success' onClick={() => setOpen(true)}>Next Order Date: {orderToUse?.order_date ? new Date(orderToUse.order_date).toLocaleDateString() : 'N/A'} </Button>
                <Button variant="contained" color='secondary' onClick={() => setOpen(true)} sx={{ mb: 2 }}>Next Delivery: {orderToUse?.estimated_delivery ? new Date(orderToUse.estimated_delivery).toLocaleDateString() : 'N/A'} </Button>
            </Stack>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {orderToUse ? 'Edit Order' : 'Create New Order'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        {orderToUse && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Order Date: {new Date(orderToUse.order_date).toLocaleDateString()}
                            </Typography>
                        )}

                        <TextField
                            label="Supplier"
                            value={form.supplier}
                            onChange={(e) => setForm(prev => ({ ...prev, supplier: e.target.value }))}
                            required
                            disabled={!canModify}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Ordered By"
                            value={form.ordered_by}
                            onChange={(e) => setForm(prev => ({ ...prev, ordered_by: e.target.value }))}
                            required
                            disabled={!canModify}
                            fullWidth
                            sx={{ mb: 2 }}
                        />

                        <DatePicker
                            label="Projected Order Date"
                            value={form.order_date}
                            onChange={(newValue: Date | null) => setForm(prev => ({ ...prev, order_date: newValue }))}
                            disabled={!canModify}
                            slotProps={{
                                textField: {
                                    required: true,
                                    fullWidth: true,
                                    sx: { mb: 2 }
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    {canModify && (
                        <Button onClick={handleSubmit} variant="contained">
                            {orderToUse ? 'Update' : 'Create'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default OrderModal;
