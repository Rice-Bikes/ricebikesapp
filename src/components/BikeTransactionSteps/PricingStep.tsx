import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Grid2, TextField, Button, Alert,
    FormControl, InputLabel, Select, MenuItem, Chip, Divider, Paper
} from '@mui/material';
import { EnhancedBike } from '../../types/BikeTransaction';
import { InspectionData } from './InspectionStep';

interface PricingStepProps {
    bike: EnhancedBike;
    inspection: InspectionData;
    onPricingComplete: (pricingData: PricingData) => void;
    existingPricing?: PricingData;
}

export interface PricingData {
    basePrice: number;
    adjustments: {
        conditionDiscount: number;
        maintenanceCredit: number;
        marketAdjustment: number;
        bulkDiscount: number;
        promotionalDiscount: number;
    };
    finalPrice: number;
    paymentMethod: 'cash' | 'card' | 'check' | 'split';
    splitPayment?: {
        cash: number;
        card: number;
        check: number;
    };
    taxAmount: number;
    totalWithTax: number;
    discountReason?: string;
    paymentProcessed: boolean;
    receiptGenerated: boolean;
}

export const PricingStep: React.FC<PricingStepProps> = ({
    bike,
    inspection,
    onPricingComplete,
    existingPricing
}) => {
    // Base pricing logic
    const getBasePriceForBike = (bike: EnhancedBike): number => {
        const basePrices = {
            'new': {
                'Road': 800,
                'Mountain': 900,
                'Hybrid': 600,
                'Cruiser': 400,
                'BMX': 300,
                'Electric': 1500,
                'Folding': 500,
                'Single Speed': 350,
                'Fixed Gear': 400,
            },
            'refurbished': {
                'Road': 400,
                'Mountain': 450,
                'Hybrid': 300,
                'Cruiser': 200,
                'BMX': 150,
                'Electric': 750,
                'Folding': 250,
                'Single Speed': 175,
                'Fixed Gear': 200,
            },
            'used': {
                'Road': 200,
                'Mountain': 225,
                'Hybrid': 150,
                'Cruiser': 100,
                'BMX': 75,
                'Electric': 375,
                'Folding': 125,
                'Single Speed': 90,
                'Fixed Gear': 100,
            }
        };

        return basePrices[bike.condition as keyof typeof basePrices][bike.bike_type as keyof typeof basePrices['new']] || bike.price;
    };

    const [pricingData, setPricingData] = useState<PricingData>(
        existingPricing || {
            basePrice: getBasePriceForBike(bike),
            adjustments: {
                conditionDiscount: 0,
                maintenanceCredit: 0,
                marketAdjustment: 0,
                bulkDiscount: 0,
                promotionalDiscount: 0,
            },
            finalPrice: 0,
            paymentMethod: 'card',
            taxAmount: 0,
            totalWithTax: 0,
            paymentProcessed: false,
            receiptGenerated: false,
        }
    );

    const [errors, setErrors] = useState<string[]>([]);
    const TAX_RATE = 0.0825; // 8.25% sales tax

    // Calculate final price whenever adjustments change
    useEffect(() => {
        const { basePrice, adjustments } = pricingData;
        const totalAdjustments = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
        const finalPrice = Math.max(0, basePrice + totalAdjustments);
        const taxAmount = finalPrice * TAX_RATE;
        const totalWithTax = finalPrice + taxAmount;

        setPricingData(prev => ({
            ...prev,
            finalPrice,
            taxAmount: Math.round(taxAmount * 100) / 100,
            totalWithTax: Math.round(totalWithTax * 100) / 100,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pricingData.basePrice,
    pricingData.adjustments.conditionDiscount,
    pricingData.adjustments.maintenanceCredit,
    pricingData.adjustments.marketAdjustment,
    pricingData.adjustments.bulkDiscount,
    pricingData.adjustments.promotionalDiscount]);

    // Auto-apply condition-based adjustments
    useEffect(() => {
        if (inspection) {
            let conditionDiscount = 0;
            let maintenanceCredit = 0;

            // Apply discounts based on cosmetic condition
            if (inspection.cosmeticCondition.frameCondition === 'fair') {
                conditionDiscount -= 25;
            } else if (inspection.cosmeticCondition.frameCondition === 'poor') {
                conditionDiscount -= 50;
            }

            if (inspection.cosmeticCondition.componentCondition === 'fair') {
                conditionDiscount -= 15;
            } else if (inspection.cosmeticCondition.componentCondition === 'poor') {
                conditionDiscount -= 30;
            }

            // Apply credit for maintenance completed
            const maintenanceCount = Object.values(inspection.maintenanceCompleted).filter(Boolean).length;
            maintenanceCredit = maintenanceCount * 10; // $10 credit per maintenance task

            setPricingData(prev => ({
                ...prev,
                adjustments: {
                    ...prev.adjustments,
                    conditionDiscount,
                    maintenanceCredit,
                }
            }));
        }
    }, [inspection]);

    const handleAdjustmentChange = (field: keyof PricingData['adjustments']) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = parseFloat(event.target.value) || 0;
        setPricingData(prev => ({
            ...prev,
            adjustments: {
                ...prev.adjustments,
                [field]: value
            }
        }));
    };

    const handlePaymentMethodChange = (event: { target: { value: string } }) => {
        const method = event.target.value as PricingData['paymentMethod'];
        setPricingData(prev => ({
            ...prev,
            paymentMethod: method,
            splitPayment: method === 'split' ? { cash: 0, card: 0, check: 0 } : undefined
        }));
    };

    const handleSplitPaymentChange = (field: keyof NonNullable<PricingData['splitPayment']>) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = parseFloat(event.target.value) || 0;
        setPricingData(prev => ({
            ...prev,
            splitPayment: prev.splitPayment ? {
                ...prev.splitPayment,
                [field]: value
            } : undefined
        }));
    };

    const validatePricing = (): boolean => {
        const newErrors: string[] = [];

        if (pricingData.finalPrice < 0) {
            newErrors.push('Final price cannot be negative');
        }

        if (pricingData.paymentMethod === 'split' && pricingData.splitPayment) {
            const splitTotal = Object.values(pricingData.splitPayment).reduce((sum, amount) => sum + amount, 0);
            const expectedTotal = pricingData.totalWithTax;

            if (Math.abs(splitTotal - expectedTotal) > 0.01) {
                newErrors.push(`Split payment amounts must equal total: $${expectedTotal.toFixed(2)}`);
            }
        }

        if (pricingData.adjustments.bulkDiscount + pricingData.adjustments.promotionalDiscount < -pricingData.basePrice) {
            newErrors.push('Total discounts cannot exceed base price');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const processPayment = () => {
        // In a real app, this would integrate with payment processing
        setPricingData(prev => ({ ...prev, paymentProcessed: true }));
    };

    const generateReceipt = () => {
        // In a real app, this would generate and print/email receipt
        setPricingData(prev => ({ ...prev, receiptGenerated: true }));
    };

    const handleSubmit = () => {
        if (validatePricing()) {
            onPricingComplete(pricingData);
        }
    };

    const isReadyForPayment = pricingData.finalPrice >= 0 && errors.length === 0;
    const isComplete = pricingData.paymentProcessed && pricingData.receiptGenerated;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Pricing & Payment
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review pricing, apply any adjustments, and process payment for the bike sale.
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

            <Grid2 container spacing={3}>
                {/* Pricing Details */}
                <Grid2 size={8}>
                    {/* Bike Summary */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {bike.make} {bike.model}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Chip label={bike.condition} size="small" />
                                <Chip label={bike.bike_type} size="small" variant="outlined" />
                                <Chip
                                    label={inspection.passedInspection ? 'Inspection Passed' : 'Inspection Required'}
                                    color={inspection.passedInspection ? 'success' : 'warning'}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="h6" color="primary">
                                Base Price: ${pricingData.basePrice.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Price Adjustments */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Price Adjustments
                            </Typography>

                            <Grid2 container spacing={2}>
                                <Grid2 size={6}>
                                    <TextField
                                        label="Condition Discount"
                                        type="number"
                                        value={pricingData.adjustments.conditionDiscount}
                                        onChange={handleAdjustmentChange('conditionDiscount')}
                                        fullWidth
                                        InputProps={{ startAdornment: '$' }}
                                        helperText="Auto-applied based on inspection"
                                        disabled
                                    />
                                </Grid2>

                                <Grid2 size={6}>
                                    <TextField
                                        label="Maintenance Credit"
                                        type="number"
                                        value={pricingData.adjustments.maintenanceCredit}
                                        onChange={handleAdjustmentChange('maintenanceCredit')}
                                        fullWidth
                                        InputProps={{ startAdornment: '$' }}
                                        helperText="Auto-applied for maintenance"
                                        disabled
                                    />
                                </Grid2>

                                <Grid2 size={6}>
                                    <TextField
                                        label="Market Adjustment"
                                        type="number"
                                        value={pricingData.adjustments.marketAdjustment}
                                        onChange={handleAdjustmentChange('marketAdjustment')}
                                        fullWidth
                                        InputProps={{ startAdornment: '$' }}
                                        helperText="Manual market price adjustment"
                                    />
                                </Grid2>

                                <Grid2 size={6}>
                                    <TextField
                                        label="Bulk Discount"
                                        type="number"
                                        value={pricingData.adjustments.bulkDiscount}
                                        onChange={handleAdjustmentChange('bulkDiscount')}
                                        fullWidth
                                        InputProps={{ startAdornment: '$' }}
                                        helperText="For multiple bike purchases"
                                    />
                                </Grid2>

                                <Grid2 size={6}>
                                    <TextField
                                        label="Promotional Discount"
                                        type="number"
                                        value={pricingData.adjustments.promotionalDiscount}
                                        onChange={handleAdjustmentChange('promotionalDiscount')}
                                        fullWidth
                                        InputProps={{ startAdornment: '$' }}
                                        helperText="Special promotions or coupons"
                                    />
                                </Grid2>

                                <Grid2 size={6}>
                                    <TextField
                                        label="Discount Reason"
                                        value={pricingData.discountReason || ''}
                                        onChange={(e) => setPricingData(prev => ({ ...prev, discountReason: e.target.value }))}
                                        fullWidth
                                        helperText="Optional reason for discounts"
                                    />
                                </Grid2>
                            </Grid2>
                        </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Payment Method
                            </Typography>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Payment Method</InputLabel>
                                <Select
                                    value={pricingData.paymentMethod}
                                    onChange={handlePaymentMethodChange}
                                    label="Payment Method"
                                >
                                    <MenuItem value="cash">Cash</MenuItem>
                                    <MenuItem value="card">Credit/Debit Card</MenuItem>
                                    <MenuItem value="check">Check</MenuItem>
                                    <MenuItem value="split">Split Payment</MenuItem>
                                </Select>
                            </FormControl>

                            {pricingData.paymentMethod === 'split' && pricingData.splitPayment && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Split Payment Amounts
                                    </Typography>
                                    <Grid2 container spacing={2}>
                                        <Grid2 size={4}>
                                            <TextField
                                                label="Cash"
                                                type="number"
                                                value={pricingData.splitPayment.cash}
                                                onChange={handleSplitPaymentChange('cash')}
                                                fullWidth
                                                InputProps={{ startAdornment: '$' }}
                                            />
                                        </Grid2>
                                        <Grid2 size={4}>
                                            <TextField
                                                label="Card"
                                                type="number"
                                                value={pricingData.splitPayment.card}
                                                onChange={handleSplitPaymentChange('card')}
                                                fullWidth
                                                InputProps={{ startAdornment: '$' }}
                                            />
                                        </Grid2>
                                        <Grid2 size={4}>
                                            <TextField
                                                label="Check"
                                                type="number"
                                                value={pricingData.splitPayment.check}
                                                onChange={handleSplitPaymentChange('check')}
                                                fullWidth
                                                InputProps={{ startAdornment: '$' }}
                                            />
                                        </Grid2>
                                    </Grid2>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Price Summary */}
                <Grid2 size={4}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h6" gutterBottom>
                            Price Summary
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Base Price:</Typography>
                                <Typography variant="body2">${pricingData.basePrice.toFixed(2)}</Typography>
                            </Box>

                            {Object.entries(pricingData.adjustments).map(([key, value]) =>
                                value !== 0 && (
                                    <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color={value < 0 ? 'error' : 'success'}>
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                        </Typography>
                                        <Typography variant="body2" color={value < 0 ? 'error' : 'success'}>
                                            {value < 0 ? '-' : '+'}${Math.abs(value).toFixed(2)}
                                        </Typography>
                                    </Box>
                                )
                            )}

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Subtotal:</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">${pricingData.finalPrice.toFixed(2)}</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Tax (8.25%):</Typography>
                                <Typography variant="body2">${pricingData.taxAmount.toFixed(2)}</Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6" color="primary">Total:</Typography>
                                <Typography variant="h6" color="primary">${pricingData.totalWithTax.toFixed(2)}</Typography>
                            </Box>
                        </Box>

                        {/* Payment Actions */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={processPayment}
                                disabled={!isReadyForPayment || pricingData.paymentProcessed}
                                fullWidth
                            >
                                {pricingData.paymentProcessed ? 'Payment Processed ✓' : 'Process Payment'}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={generateReceipt}
                                disabled={!pricingData.paymentProcessed || pricingData.receiptGenerated}
                                fullWidth
                            >
                                {pricingData.receiptGenerated ? 'Receipt Generated ✓' : 'Generate Receipt'}
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                                disabled={!isComplete}
                                fullWidth
                            >
                                Complete Sale
                            </Button>
                        </Box>

                        {/* Payment Status */}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Payment Status:
                            </Typography>
                            <Chip
                                label={pricingData.paymentProcessed ? 'Paid' : 'Pending'}
                                color={pricingData.paymentProcessed ? 'success' : 'warning'}
                                size="small"
                            />
                            <Chip
                                label={pricingData.receiptGenerated ? 'Receipt Generated' : 'Receipt Pending'}
                                color={pricingData.receiptGenerated ? 'success' : 'default'}
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        </Box>
                    </Paper>
                </Grid2>
            </Grid2>
        </Box>
    );
};
