import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Alert, Card, CardContent,
    FormControlLabel, Checkbox, Chip, Divider, TextField,
    InputAdornment, Table, TableBody, TableCell, TableRow
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { ShoppingCart, Receipt, CheckCircle } from '@mui/icons-material';

interface CheckoutStepProps {
    onStepComplete: () => void;
}

export const CheckoutStep: React.FC<CheckoutStepProps> = ({ onStepComplete }) => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const { transaction } = useWorkflowSteps(transaction_id || '');

    const [bikePrice, setBikePrice] = useState(0);
    const [tax, setTax] = useState(0);
    const [finalAmount, setFinalAmount] = useState(0);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [receiptGenerated, setReceiptGenerated] = useState(false);
    const [transactionCompleted, setTransactionCompleted] = useState(false);

    const depositAmount = 50; // Default deposit amount - in production this would come from transaction data
    const taxRate = 0.0825; // 8.25% tax rate

    // Calculate totals
    useEffect(() => {
        const subtotal = bikePrice;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        const amountDue = Math.max(0, total - depositAmount);

        setTax(taxAmount);
        setFinalAmount(amountDue);
    }, [bikePrice, depositAmount]);

    // Load bike price from transaction
    useEffect(() => {
        // In the new system, business data comes from transaction
        if (transaction?.Bike?.price) {
            setBikePrice(transaction.Bike.price);
        } else {
            setBikePrice(500); // Default bike price
        }
    }, [transaction]);

    const handlePaymentComplete = async (completed: boolean) => {
        setPaymentCompleted(completed);
        if (completed) {
            setReceiptGenerated(true);
        }
    };

    const handleTransactionComplete = async (completed: boolean) => {
        setTransactionCompleted(completed);
        if (completed) {
            // In production, this would update the main transaction
            onStepComplete();
        }
    };

    const handleAdvanceStep = async () => {
        if (canAdvance) {
            await handleTransactionComplete(true);
            onStepComplete();
        }
    };

    const canAdvance = paymentCompleted && receiptGenerated && transactionCompleted;
    const bike = transaction?.Bike;
    const customer = transaction?.Customer;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                Final Checkout
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete the final payment and finalize the bike sale transaction.
            </Typography>

            {/* Transaction Summary */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Transaction Summary</Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                            <Typography variant="body1">
                                {customer?.first_name} {customer?.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {customer?.email}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Bike</Typography>
                            <Typography variant="body1">
                                {bike?.make} {bike?.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {bike?.bike_type} | {bike?.size_cm}cm | {bike?.condition}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Pricing Breakdown</Typography>

                    <TextField
                        label="Bike Price"
                        type="number"
                        value={bikePrice}
                        onChange={(e) => setBikePrice(Number(e.target.value))}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ mb: 3, width: 200 }}
                    />

                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>Bike Price</TableCell>
                                <TableCell align="right">${bikePrice.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Tax ({(taxRate * 100).toFixed(2)}%)</TableCell>
                                <TableCell align="right">${tax.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Subtotal</strong></TableCell>
                                <TableCell align="right"><strong>${(bikePrice + tax).toFixed(2)}</strong></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Previous Deposit</TableCell>
                                <TableCell align="right" sx={{ color: 'success.main' }}>
                                    -${depositAmount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell variant="head"><strong>Amount Due</strong></TableCell>
                                <TableCell align="right" variant="head">
                                    <strong>${finalAmount.toFixed(2)}</strong>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Processing */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Payment Processing
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={paymentCompleted}
                                    onChange={(e) => handlePaymentComplete(e.target.checked)}
                                />
                            }
                            label={`Payment of $${finalAmount.toFixed(2)} received from customer`}
                        />
                    </Box>

                    {paymentCompleted && (
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                ✅ Payment received successfully!
                            </Alert>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={receiptGenerated}
                                        onChange={(e) => setReceiptGenerated(e.target.checked)}
                                    />
                                }
                                label="Receipt generated and provided to customer"
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Final Completion */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Transaction Completion
                    </Typography>

                    {paymentCompleted && receiptGenerated && (
                        <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={transactionCompleted}
                                        onChange={(e) => handleTransactionComplete(e.target.checked)}
                                    />
                                }
                                label="Mark transaction as completed and bike as sold"
                            />

                            {transactionCompleted && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    🎉 Transaction completed successfully! The bike has been sold to the customer.
                                </Alert>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Status Indicators */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                    label={paymentCompleted ? 'Payment Complete' : 'Awaiting Payment'}
                    color={paymentCompleted ? 'success' : 'warning'}
                    variant="filled"
                />
                <Chip
                    label={receiptGenerated ? 'Receipt Generated' : 'Receipt Pending'}
                    color={receiptGenerated ? 'success' : 'default'}
                    variant={receiptGenerated ? 'filled' : 'outlined'}
                />
                <Chip
                    label={transactionCompleted ? 'Transaction Complete' : 'Transaction Pending'}
                    color={transactionCompleted ? 'success' : 'default'}
                    variant={transactionCompleted ? 'filled' : 'outlined'}
                />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Step 4 of 4: Final Checkout
                </Typography>

                <Button
                    variant="contained"
                    onClick={handleAdvanceStep}
                    disabled={!canAdvance}
                    size="large"
                    color="success"
                >
                    Complete Sale 🎉
                </Button>
            </Box>
        </Box>
    );
};
