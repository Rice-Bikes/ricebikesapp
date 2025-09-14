import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Grid2, Alert } from '@mui/material';
import { Customer } from '../../model';

interface CustomerInfoStepProps {
    onCustomerSelected: (customer: Customer) => void;
    existingCustomer?: Customer;
}

export const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
    onCustomerSelected,
    existingCustomer
}) => {
    const [customerData, setCustomerData] = useState({
        first_name: existingCustomer?.first_name || '',
        last_name: existingCustomer?.last_name || '',
        email: existingCustomer?.email || '',
        phone: existingCustomer?.phone || ''
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!customerData.first_name.trim()) {
            errors.first_name = 'First name is required';
        }

        if (!customerData.last_name.trim()) {
            errors.last_name = 'Last name is required';
        }

        if (!customerData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!customerData.phone?.trim()) {
            errors.phone = 'Phone number is required';
        } else {
            const cleanPhone = customerData.phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                errors.phone = 'Phone number must be 10 digits';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof typeof customerData) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setCustomerData(prev => ({
            ...prev,
            [field]: event.target.value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleConfirmCustomer = () => {
        if (validateForm()) {
            onCustomerSelected(customerData as Customer);
        }
    };

    return (
        <Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Enter the customer's contact information for this bike sale.
            </Typography>

            <Grid2 container spacing={2}>
                <Grid2 size={6}>
                    <TextField
                        fullWidth
                        label="First Name"
                        value={customerData.first_name}
                        onChange={handleInputChange('first_name')}
                        error={!!validationErrors.first_name}
                        helperText={validationErrors.first_name}
                        required
                    />
                </Grid2>

                <Grid2 size={6}>
                    <TextField
                        fullWidth
                        label="Last Name"
                        value={customerData.last_name}
                        onChange={handleInputChange('last_name')}
                        error={!!validationErrors.last_name}
                        helperText={validationErrors.last_name}
                        required
                    />
                </Grid2>

                <Grid2 size={12}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={customerData.email}
                        onChange={handleInputChange('email')}
                        error={!!validationErrors.email}
                        helperText={validationErrors.email}
                        required
                    />
                </Grid2>

                <Grid2 size={12}>
                    <TextField
                        fullWidth
                        label="Phone Number"
                        value={customerData.phone}
                        onChange={handleInputChange('phone')}
                        error={!!validationErrors.phone}
                        helperText={validationErrors.phone}
                        placeholder="(555) 123-4567"
                        required
                    />
                </Grid2>
            </Grid2>

            {existingCustomer && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Customer information loaded from existing transaction.
                </Alert>
            )}

            <Box sx={{ mt: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleConfirmCustomer}
                    size="large"
                >
                    Confirm Customer Information
                </Button>
            </Box>
        </Box>
    );
};
