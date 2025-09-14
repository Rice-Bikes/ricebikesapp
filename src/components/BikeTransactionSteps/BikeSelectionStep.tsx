import React, { useState } from 'react';
import {
    Box, Button, Typography, Alert,
    Grid2, TextField,
    FormControl, InputLabel, Select, MenuItem, Card, CardContent, Chip,
    SelectChangeEvent, CircularProgress
} from '@mui/material';
import { useParams } from 'react-router-dom';
import DBModel, { Bike } from '../../model';
import { useMutation, useQueryClient } from '@tanstack/react-query';


interface BikeSelectionStepProps {
    onBikeCreated: (bike: Bike) => void;
    existingBike?: Bike;
}

export const BikeSelectionStep: React.FC<BikeSelectionStepProps> = ({
    onBikeCreated,
    existingBike
}) => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const queryClient = useQueryClient();

    const [bikeData, setBikeData] = useState<{
        make: string;
        model: string;
        description: string;
        bike_type: string;
        size_cm: string | number;
        condition: string;
        price: string | number;
    }>({
        make: existingBike?.make || '',
        model: existingBike?.model || '',
        description: existingBike?.description || '',
        bike_type: existingBike?.bike_type || 'Road', // Default
        size_cm: existingBike?.size_cm || 50, // Re-enabled now that backend supports it
        condition: existingBike?.condition || 'Refurbished' as const,
        price: existingBike?.price || 150 // Default for refurbished
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isCreating, setIsCreating] = useState(false);

    // Mutation for creating bike and updating transaction
    const createBikeMutation = useMutation<Bike | null, Error, typeof bikeData>({
        mutationFn: async (bikeFormData: {
            make: string;
            model: string;
            description: string;
            bike_type: string;
            size_cm: string | number; // Allow both string and number
            condition: string;
            price: string | number; // Allow both string and number
        }) => {
            // Ensure proper type conversion for numeric fields
            const processedBikeData = {
                make: bikeFormData.make,
                model: bikeFormData.model,
                description: bikeFormData.description,
                bike_type: bikeFormData.bike_type,
                condition: bikeFormData.condition,
                // Ensure numeric fields are properly converted
                price: typeof bikeFormData.price === 'string'
                    ? parseFloat(bikeFormData.price) || 0
                    : bikeFormData.price,
                size_cm: typeof bikeFormData.size_cm === 'string'
                    ? parseFloat(bikeFormData.size_cm) || 0
                    : bikeFormData.size_cm,
            };

            // Create the bike first - now with full backend support
            const newBike = await DBModel.createBike({
                make: processedBikeData.make,
                model: processedBikeData.model,
                description: processedBikeData.description,
                bike_type: processedBikeData.bike_type,
                size_cm: processedBikeData.size_cm,
                condition: processedBikeData.condition,
                price: processedBikeData.price,
                is_available: true
            } as Bike) as Bike;

            // Update the transaction with the new bike_id
            if (transaction_id && newBike && newBike.bike_id) {
                // Get current transaction to preserve existing fields
                const currentTransaction = await DBModel.fetchTransaction(transaction_id);

                // Calculate total cost with proper type conversion
                const bikePrice = typeof processedBikeData.price === 'number' ? processedBikeData.price : 0;
                const currentCost = typeof currentTransaction.total_cost === 'number'
                    ? currentTransaction.total_cost
                    : parseFloat(currentTransaction.total_cost as string) || 0;

                // Only update the bike_id, preserving other updatable fields
                await DBModel.updateTransaction(transaction_id, {
                    transaction_type: currentTransaction.transaction_type,
                    bike_id: newBike.bike_id,
                    total_cost: bikePrice || currentCost, // Ensure it's a number
                    description: currentTransaction.description,
                    is_completed: currentTransaction.is_completed,
                    is_paid: currentTransaction.is_paid,
                    is_refurb: currentTransaction.is_refurb,
                    is_urgent: currentTransaction.is_urgent,
                    is_nuclear: currentTransaction.is_nuclear,
                    is_beer_bike: currentTransaction.is_beer_bike,
                    is_reserved: currentTransaction.is_reserved,
                    is_waiting_on_email: currentTransaction.is_waiting_on_email,
                    date_completed: currentTransaction.date_completed
                });
            }

            return newBike;
        },
        onSuccess: (createdBike) => {
            if (createdBike) {
                queryClient.invalidateQueries({ queryKey: ['transaction', transaction_id] });
                onBikeCreated(createdBike);
                setIsCreating(false);
            } else {
                console.error('Bike creation returned null');
                setIsCreating(false);
            }
        },
        onError: (error) => {
            console.error('Error creating bike:', error);
            setIsCreating(false);
        }
    });

    const bikeTypes = [
        'Road', 'Mountain', 'Hybrid', 'Cruiser', 'BMX',
        'Electric', 'Folding', 'Single Speed', 'Fixed Gear'
    ];

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!bikeData.make.trim()) {
            errors.make = 'Bike make is required';
        }

        if (!bikeData.model.trim()) {
            errors.model = 'Bike model is required';
        }

        // Convert and validate price
        const priceValue = typeof bikeData.price === 'string' ? parseFloat(bikeData.price) : bikeData.price;
        if (isNaN(priceValue) || priceValue <= 0) {
            errors.price = 'Price must be a valid number greater than $0';
        }

        // Convert and validate size_cm
        const sizeValue = typeof bikeData.size_cm === 'string' ? parseFloat(bikeData.size_cm) : bikeData.size_cm;
        if (isNaN(sizeValue) || sizeValue < 30 || sizeValue > 80) {
            errors.size_cm = 'Size must be a valid number between 30cm and 80cm';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof typeof bikeData) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        let value: string | number = event.target.value;

        // Allow floats for numeric fields without forcing conversion during typing
        if (field === 'price' || field === 'size_cm') {
            // Keep as string if it's a valid partial float (allows typing decimals)
            const stringValue = value as string;
            if (stringValue === '' || /^\d*\.?\d*$/.test(stringValue)) {
                value = stringValue; // Keep as string to preserve typing flow
            } else {
                const numValue = parseFloat(stringValue);
                value = isNaN(numValue) ? '' : numValue.toString();
            }
        }

        setBikeData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleSelectChange = (field: keyof typeof bikeData) => (
        event: SelectChangeEvent
    ) => {
        const value: string = event.target.value;
        // Keep value as string for consistency - numeric fields will be converted during validation/submission

        setBikeData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleConfirmBike = async () => {
        if (validateForm()) {
            if (existingBike) {
                // If updating existing bike, just call the callback
                onBikeCreated(existingBike);
            } else {
                // Create new bike
                setIsCreating(true);
                createBikeMutation.mutate(bikeData);
            }
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Bike Selection & Details
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Enter or confirm the details of the bike being sold.
            </Typography>

            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Current Selection Preview:
                    </Typography>
                    <Typography variant="h6">
                        {bikeData.make} {bikeData.model}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={bikeData.bike_type} color="primary" size="small" />
                        <Chip label={`${bikeData.size_cm}cm`} color="secondary" size="small" />
                        <Chip label={bikeData.condition} color="success" size="small" />
                        <Chip label={`$${bikeData.price}`} color="warning" size="small" />
                    </Box>
                </CardContent>
            </Card>

            <Grid2 container spacing={2}>
                <Grid2 size={6}>
                    <TextField
                        fullWidth
                        label="Make"
                        value={bikeData.make}
                        onChange={handleInputChange('make')}
                        error={!!validationErrors.make}
                        helperText={validationErrors.make}
                        placeholder="e.g. Trek, Specialized, Giant"
                        required
                    />
                </Grid2>

                <Grid2 size={6}>
                    <TextField
                        fullWidth
                        label="Model"
                        value={bikeData.model}
                        onChange={handleInputChange('model')}
                        error={!!validationErrors.model}
                        helperText={validationErrors.model}
                        placeholder="e.g. FX 3, Allez, Escape"
                        required
                    />
                </Grid2>

                <Grid2 size={12}>
                    <TextField
                        fullWidth
                        label="Description"
                        value={bikeData.description}
                        onChange={handleInputChange('description')}
                        multiline
                        rows={2}
                        placeholder="Additional details about the bike condition, accessories, etc."
                    />
                </Grid2>

                <Grid2 size={6}>
                    <FormControl fullWidth>
                        <InputLabel>Bike Type</InputLabel>
                        <Select
                            value={bikeData.bike_type}
                            onChange={handleSelectChange('bike_type')}
                            label="Bike Type"
                        >
                            {bikeTypes.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid2>

                <Grid2 size={6}>
                    <TextField
                        fullWidth
                        label="Size (cm)"
                        value={bikeData.size_cm}
                        onChange={handleInputChange('size_cm')}
                        error={!!validationErrors.size_cm}
                        helperText={validationErrors.size_cm || 'Enter size between 30-80cm'}
                        placeholder="e.g. 54"
                        required
                    />
                </Grid2>

                <Grid2 size={6}>
                    <FormControl fullWidth>
                        <InputLabel>Condition</InputLabel>
                        <Select
                            value={bikeData.condition}
                            onChange={handleSelectChange('condition')}
                            label="Condition"
                        >
                            <MenuItem value="New">New</MenuItem>
                            <MenuItem value="Refurbished">Refurbished</MenuItem>
                            <MenuItem value="Used">Used</MenuItem>
                        </Select>
                    </FormControl>
                </Grid2>

                <Grid2 size={6}>
                    <TextField
                        fullWidth
                        label="Sale Price"
                        value={bikeData.price}
                        onChange={handleInputChange('price')}
                        error={!!validationErrors.price}
                        helperText={validationErrors.price}
                        slotProps={{
                            input: {
                                startAdornment: '$'
                            }
                        }}
                        required
                    />
                </Grid2>
            </Grid2>

            {existingBike && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Bike information loaded from existing transaction. Update as needed.
                </Alert>
            )}

            <Box sx={{ mt: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleConfirmBike}
                    size="large"
                    disabled={isCreating || createBikeMutation.isPending}
                    startIcon={
                        (isCreating || createBikeMutation.isPending) ?
                            <CircularProgress size={20} /> :
                            null
                    }
                >
                    {existingBike ? 'Confirm Bike Selection' :
                        (isCreating || createBikeMutation.isPending) ? 'Creating Bike...' : 'Create & Confirm Bike'}
                </Button>

                {createBikeMutation.isError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Failed to create bike. Please try again.
                    </Alert>
                )}
            </Box>
        </Box>
    );
};
