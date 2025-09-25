import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Alert, Card, CardContent,
    FormControlLabel, Checkbox, Chip, Divider, TextField,
    InputAdornment, Table, TableBody, TableCell, TableRow
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { ShoppingCart, Receipt, } from '@mui/icons-material';
import { Customer } from '../../model';
import DBModel from '../../model';
import { CustomerReservation } from '../CustomerReservation';
import Notes from '../Notes/Notes';
import { useCurrentUser } from '../../hooks/useUserQuery';
import { toast } from 'react-toastify';
import { queryClient } from '../../app/queryClient';

interface CheckoutStepProps {
    onStepComplete: () => void;
}

export const CheckoutStep: React.FC<CheckoutStepProps> = ({ onStepComplete }) => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const { transaction } = useWorkflowSteps(transaction_id || '');
    const currentUser = useCurrentUser();

    const [bikePrice, setBikePrice] = useState(0);
    const [tax, setTax] = useState(0);
    const [finalAmount, setFinalAmount] = useState(0);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [receiptGenerated, setReceiptGenerated] = useState(false);
    const [notes, setNotes] = useState('');
    // Reservation modal state
    const [customerReserved, setCustomerReserved] = useState(false);
    const [reservedCustomer, setReservedCustomer] = useState<Customer | null>(null);

    const taxRate = 0.0825; // 8.25% tax rate
    const isAvailable = transaction?.Bike?.is_available || false;
    const depositAmount = transaction?.Bike?.deposit_amount || 0;
    // Calculate totals
    useEffect(() => {
        const subtotal = bikePrice;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;
        const amountDue = isAvailable ? total : Math.max(0, total - depositAmount); // Subtract deposit if reserved

        setTax(taxAmount);
        setFinalAmount(amountDue);
    }, [bikePrice, isAvailable, depositAmount]);

    // Load bike price from transaction
    useEffect(() => {
        // In the new system, business data comes from transaction
        if (transaction?.Bike?.price) {
            setBikePrice(transaction.Bike.price);
        } else {
            setBikePrice(500); // Default bike price
        }
    }, [transaction]);

    // Check if customer is already assigned and reserved
    useEffect(() => {
        if (transaction?.Customer && transaction?.is_reserved) {
            setReservedCustomer(transaction.Customer as Customer);
            setCustomerReserved(true);
        }
    }, [transaction]);

    const handlePaymentComplete = async (completed: boolean) => {
        setPaymentCompleted(completed);
        if (completed) {
            setReceiptGenerated(true);
        }
    };

    const handleTransactionComplete = async (completed: boolean) => {
        if (completed) {
            // In production, this would update the main transaction
            onStepComplete();
        }
    };

    const handleReservationComplete = async (customer: Customer, reservationDetails: { deposit_amount: number; bike_id: string }) => {
        setReservedCustomer(customer);
        setCustomerReserved(true);

        // The deposit amount is already accounted for in our calculations
        console.log('Reservation completed for customer:', customer, 'with deposit:', reservationDetails.deposit_amount);
    };

    const handleNotesChange = async (newNotes: string) => {
        setNotes(newNotes);

        // Save notes to transaction description field
        if (transaction_id && transaction) {
            try {
                await DBModel.updateTransaction(transaction_id, {
                    ...transaction,
                    description: newNotes
                });

                // Invalidate transaction query to refresh data
                queryClient.invalidateQueries({ queryKey: ['transaction', transaction_id] });

                toast.success('Notes updated successfully');
            } catch (error) {
                console.error('Error saving notes:', error);
                toast.error('Failed to save notes');
            }
        }
    };

    const handleAdvanceStep = async () => {
        if (canAdvance) {
            await handleTransactionComplete(true);
            onStepComplete();
        }
    };

    const canAdvance = customerReserved && paymentCompleted && receiptGenerated;
    const bike = transaction?.Bike;
    const customer = reservedCustomer || transaction?.Customer;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                Final Checkout
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete the final payment and finalize the bike sale transaction.
            </Typography>

            {/* Customer Reservation Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Customer & Reservation
                    </Typography>

                    {customerReserved && reservedCustomer ? (
                        <Box>

                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {reservedCustomer.first_name} {reservedCustomer.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {reservedCustomer.email} | {reservedCustomer.phone}
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                A customer reservation is required before final checkout.
                            </Typography>
                            <CustomerReservation
                                transaction_id={transaction_id ?? ''}
                                transaction={transaction}
                                variant="outlined"
                                isFinalStep={true}
                                onCustomerAssigned={(customer) => handleReservationComplete(customer, { deposit_amount: bike?.deposit_amount || 0, bike_id: bike?.bike_id || '' })}
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>



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

            {/* Notes Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Checkout Notes
                    </Typography>
                    {currentUser && transaction ? (
                        <Notes
                            notes={transaction.description || ''}
                            onSave={handleNotesChange}
                            user={currentUser}
                            transaction_num={transaction.transaction_num}
                        />
                    ) : (
                        <TextField
                            label="Checkout Notes"
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="Add any special notes about this sale, payment arrangements, or customer requests..."
                            helperText="These notes will be included with the transaction record"
                        />
                    )}
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
                            {<TableRow>
                                <TableCell>Previous Deposit</TableCell>
                                <TableCell align="right" sx={{ color: 'success.main' }}>
                                    -${depositAmount.toFixed(2)}
                                </TableCell>
                            </TableRow>}
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

                    {!customerReserved && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Complete customer reservation before processing payment.
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={paymentCompleted}
                                    onChange={(e) => handlePaymentComplete(e.target.checked)}
                                    disabled={!customerReserved}
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



            {/* Status Indicators */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                    label={customerReserved ? 'Customer Reserved' : 'Customer Pending'}
                    color={customerReserved ? 'success' : 'error'}
                    variant="filled"
                />
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
