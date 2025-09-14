import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Grid2, Button, Alert, Chip,
    Paper, Divider, TextField, FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { EnhancedBike } from '../../types/BikeTransaction';
import { InspectionData } from './InspectionStep';
import { PricingData } from './PricingStep';
import { Customer } from '../../model';

interface CompletionStepProps {
    bike: EnhancedBike;
    customer: Customer; // Customer data from CustomerInfoStep
    inspection: InspectionData;
    pricing: PricingData;
    onTransactionComplete: (completionData: CompletionData) => void;
}

export interface CompletionData {
    receiptNumber: string;
    warrantyProvided: boolean;
    warrantyPeriod?: number; // in months
    accessoriesIncluded: string[];
    deliveryNotes: string;
    followUpScheduled: boolean;
    followUpDate?: Date;
    customerSatisfaction?: 1 | 2 | 3 | 4 | 5;
    finalNotes: string;
    staffSignature: string;
    completedAt: Date;
    inventoryUpdated: boolean;
    transactionRecorded: boolean;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
    bike,
    customer,
    inspection,
    pricing,
    onTransactionComplete
}) => {
    const [completionData, setCompletionData] = useState<CompletionData>({
        receiptNumber: generateReceiptNumber(),
        warrantyProvided: bike.condition === 'New' || bike.condition === 'Refurbished',
        warrantyPeriod: bike.condition === 'New' ? 12 : bike.condition === 'Refurbished' ? 6 : 0,
        accessoriesIncluded: [],
        deliveryNotes: '',
        followUpScheduled: false,
        customerSatisfaction: 5,
        finalNotes: '',
        staffSignature: '',
        completedAt: new Date(),
        inventoryUpdated: false,
        transactionRecorded: false,
    });

    const [errors, setErrors] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Auto-complete some tasks
    useEffect(() => {
        const timer = setTimeout(() => {
            setCompletionData(prev => ({
                ...prev,
                inventoryUpdated: true,
                transactionRecorded: true,
            }));
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    function generateReceiptNumber(): string {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `RB${year}${month}${day}-${random}`;
    }

    const handleAccessoryChange = (accessory: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setCompletionData(prev => ({
                ...prev,
                accessoriesIncluded: [...prev.accessoriesIncluded, accessory]
            }));
        } else {
            setCompletionData(prev => ({
                ...prev,
                accessoriesIncluded: prev.accessoriesIncluded.filter(item => item !== accessory)
            }));
        }
    };

    const validateCompletion = (): boolean => {
        const newErrors: string[] = [];

        if (!completionData.staffSignature.trim()) {
            newErrors.push('Staff signature/initials are required');
        }

        if (!pricing.paymentProcessed) {
            newErrors.push('Payment must be processed before completion');
        }

        if (!inspection.passedInspection) {
            newErrors.push('Bike must pass inspection before sale completion');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleComplete = async () => {
        if (!validateCompletion()) return;

        setIsProcessing(true);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        onTransactionComplete(completionData);
        setIsProcessing(false);
    };

    const commonAccessories = [
        'Lock', 'Helmet', 'Lights', 'Bell', 'Water Bottle Cage',
        'Pump', 'Repair Kit', 'Basket', 'Phone Mount'
    ];

    const isComplete = completionData.inventoryUpdated &&
        completionData.transactionRecorded &&
        completionData.staffSignature.trim() &&
        pricing.paymentProcessed &&
        inspection.passedInspection;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Sale Completion
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Finalize the transaction and complete all necessary documentation.
            </Typography>

            {errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            {isComplete && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    🎉 All requirements completed! Transaction is ready to be finalized.
                </Alert>
            )}

            <Grid2 container spacing={3}>
                {/* Transaction Summary */}
                <Grid2 size={8}>
                    {/* Sale Summary */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Transaction Summary
                            </Typography>

                            <Grid2 container spacing={2}>
                                <Grid2 size={6}>
                                    <Typography variant="body2" color="text.secondary">Bike</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {bike.make} {bike.model}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip label={bike.condition} size="small" />
                                        <Chip label={bike.bike_type} size="small" variant="outlined" />
                                    </Box>
                                </Grid2>

                                <Grid2 size={6}>
                                    <Typography variant="body2" color="text.secondary">Customer</Typography>
                                    <Typography variant="body1">
                                        {`${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Customer Name'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {customer?.email || 'customer@email.com'}
                                    </Typography>
                                </Grid2>

                                <Grid2 size={6}>
                                    <Typography variant="body2" color="text.secondary">Payment</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="success.main">
                                        ${pricing.totalWithTax.toFixed(2)}
                                    </Typography>
                                    <Typography variant="body2">
                                        {pricing.paymentMethod} {pricing.paymentProcessed ? '(Processed)' : '(Pending)'}
                                    </Typography>
                                </Grid2>

                                <Grid2 size={6}>
                                    <Typography variant="body2" color="text.secondary">Receipt #</Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {completionData.receiptNumber}
                                    </Typography>
                                </Grid2>
                            </Grid2>
                        </CardContent>
                    </Card>

                    {/* Warranty & Accessories */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Warranty & Accessories
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={completionData.warrantyProvided}
                                            onChange={(e) => setCompletionData(prev => ({ ...prev, warrantyProvided: e.target.checked }))}
                                        />
                                    }
                                    label={`Warranty Provided (${completionData.warrantyPeriod} months)`}
                                />
                            </Box>

                            <Typography variant="subtitle2" gutterBottom>
                                Accessories Included
                            </Typography>
                            <FormGroup row>
                                {commonAccessories.map(accessory => (
                                    <FormControlLabel
                                        key={accessory}
                                        control={
                                            <Checkbox
                                                checked={completionData.accessoriesIncluded.includes(accessory)}
                                                onChange={handleAccessoryChange(accessory)}
                                            />
                                        }
                                        label={accessory}
                                    />
                                ))}
                            </FormGroup>
                        </CardContent>
                    </Card>

                    {/* Delivery & Follow-up */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Delivery & Follow-up
                            </Typography>

                            <TextField
                                label="Delivery Notes"
                                value={completionData.deliveryNotes}
                                onChange={(e) => setCompletionData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                                multiline
                                rows={2}
                                fullWidth
                                placeholder="Special delivery instructions or notes..."
                                sx={{ mb: 2 }}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={completionData.followUpScheduled}
                                        onChange={(e) => setCompletionData(prev => ({ ...prev, followUpScheduled: e.target.checked }))}
                                    />
                                }
                                label="Schedule follow-up contact"
                            />
                        </CardContent>
                    </Card>

                    {/* Final Notes & Signature */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Final Notes & Sign-off
                            </Typography>

                            <TextField
                                label="Final Transaction Notes"
                                value={completionData.finalNotes}
                                onChange={(e) => setCompletionData(prev => ({ ...prev, finalNotes: e.target.value }))}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder="Any final notes about the sale or customer interaction..."
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                label="Staff Signature/Initials"
                                value={completionData.staffSignature}
                                onChange={(e) => setCompletionData(prev => ({ ...prev, staffSignature: e.target.value }))}
                                required
                                fullWidth
                                inputProps={{ maxLength: 10 }}
                            />
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Status Panel */}
                <Grid2 size={4}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h6" gutterBottom>
                            Completion Status
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Inspection</Typography>
                                <Chip
                                    label={inspection.passedInspection ? 'Passed' : 'Failed'}
                                    color={inspection.passedInspection ? 'success' : 'error'}
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Payment</Typography>
                                <Chip
                                    label={pricing.paymentProcessed ? 'Processed' : 'Pending'}
                                    color={pricing.paymentProcessed ? 'success' : 'warning'}
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Receipt</Typography>
                                <Chip
                                    label={pricing.receiptGenerated ? 'Generated' : 'Pending'}
                                    color={pricing.receiptGenerated ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Inventory</Typography>
                                <Chip
                                    label={completionData.inventoryUpdated ? 'Updated' : 'Updating...'}
                                    color={completionData.inventoryUpdated ? 'success' : 'warning'}
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">Transaction Record</Typography>
                                <Chip
                                    label={completionData.transactionRecorded ? 'Recorded' : 'Recording...'}
                                    color={completionData.transactionRecorded ? 'success' : 'warning'}
                                    size="small"
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" color="primary" gutterBottom>
                            Total: ${pricing.totalWithTax.toFixed(2)}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Receipt #{completionData.receiptNumber}
                        </Typography>

                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            fullWidth
                            onClick={handleComplete}
                            disabled={!isComplete || isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Complete Transaction'}
                        </Button>

                        {!isComplete && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                    Complete all required items above to finalize the transaction.
                                </Typography>
                            </Alert>
                        )}
                    </Paper>
                </Grid2>
            </Grid2>
        </Box>
    );
};
