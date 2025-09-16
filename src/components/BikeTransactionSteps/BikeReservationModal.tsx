import React, { useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    Grid2,
    Typography,
    Alert,
    Box
} from '@mui/material';
import { EnhancedBike } from '../../types/BikeTransaction';
import { CreateCustomer, Customer } from '../../model';

interface BikeReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    bike: EnhancedBike;
    customer?: Customer; // Optional pre-filled customer
    onReservationComplete: (customer: Customer, reservationDetails: {
        deposit_amount: number;
        bike_id: string;
    }) => void;
}

const DEPOSIT_AMOUNT = 50;

export const BikeReservationModal: React.FC<BikeReservationModalProps> = ({
    isOpen,
    onClose,
    bike,
    customer,
    onReservationComplete,
}) => {
    const [formState, setFormState] = useState<CreateCustomer>({
        first_name: customer?.first_name || '',
        last_name: customer?.last_name || '',
        email: customer?.email || '',
        phone: customer?.phone || ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState((prev: CreateCustomer) => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (error) setError(null);
    };

    const validateForm = (): boolean => {
        if (!formState.first_name.trim()) {
            setError('First name is required');
            return false;
        }
        if (!formState.last_name.trim()) {
            setError('Last name is required');
            return false;
        }
        if (!formState.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!(formState.phone ?? '').trim()) {
            setError('Phone number is required');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formState.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        // Basic phone validation (flexible format)
        const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
        if (!phoneRegex.test(formState.phone ?? '')) {
            setError('Please enter a valid phone number');
            return false;
        }

        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Use existing customer or create new one
            const reservationCustomer: Customer = customer ? {
                ...customer,
                ...formState // Allow form updates to override existing customer data
            } : {
                customer_id: `cust_${Date.now()}`,
                ...formState
            };

            const reservationDetails = {
                deposit_amount: DEPOSIT_AMOUNT,
                bike_id: bike.bike_id
            };

            // Call the parent handler
            onReservationComplete(reservationCustomer, reservationDetails);

            // Reset form to original customer data or empty
            setFormState({
                first_name: customer?.first_name || '',
                last_name: customer?.last_name || '',
                email: customer?.email || '',
                phone: customer?.phone || ''
            });

            onClose();
        } catch (err) {
            setError('Failed to create reservation. Please try again.');
            console.error('Reservation error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            // Reset form to original customer data or empty
            setFormState({
                first_name: customer?.first_name || '',
                last_name: customer?.last_name || '',
                email: customer?.email || '',
                phone: customer?.phone || ''
            });
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle>
                <Typography variant="h5" component="div">
                    Reserve Bike
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    {bike.make} {bike.model} - {bike.condition}
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Alert severity="info">
                            <Typography variant="body2">
                                <strong>Reservation Details:</strong><br />
                                • A ${DEPOSIT_AMOUNT} deposit will be charged<br />
                                • Deposit will be applied to final purchase price<br />
                                • Reservation is valid for 7 days
                            </Typography>
                        </Alert>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid2 container spacing={2}>
                        <Grid2 size={6}>
                            <TextField
                                name="first_name"
                                label="First Name"
                                value={formState.first_name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </Grid2>
                        <Grid2 size={6}>
                            <TextField
                                name="last_name"
                                label="Last Name"
                                value={formState.last_name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={isSubmitting}
                            />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField
                                name="email"
                                label="Email"
                                type="email"
                                value={formState.email}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={isSubmitting}
                            />
                        </Grid2>
                        <Grid2 size={12}>
                            <TextField
                                name="phone"
                                label="Phone Number"
                                value={formState.phone}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={isSubmitting}
                                helperText="Include area code (e.g., (555) 123-4567)"
                            />
                        </Grid2>
                    </Grid2>

                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            Bike Details
                        </Typography>
                        <Grid2 container spacing={1}>
                            <Grid2 size={6}>
                                <Typography variant="body2"><strong>Make & Model:</strong> {bike.make} {bike.model}</Typography>
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body2"><strong>Type:</strong> {bike.bike_type}</Typography>
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body2"><strong>Size:</strong> {bike.size_cm} cm</Typography>
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body2"><strong>Condition:</strong> {bike.condition}</Typography>
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body2"><strong>Price:</strong> ${bike.price ? bike.price.toFixed(2) : '0.00'}</Typography>
                            </Grid2>
                            <Grid2 size={6}>
                                <Typography variant="body2"><strong>Deposit:</strong> ${DEPOSIT_AMOUNT.toFixed(2)}</Typography>
                            </Grid2>
                        </Grid2>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{ minWidth: 120 }}
                    >
                        {isSubmitting ? 'Processing...' : `Reserve with $${DEPOSIT_AMOUNT} Deposit`}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
