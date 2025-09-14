import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, Alert, Card, CardContent,
    FormControlLabel, Checkbox, Chip, Divider
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { Customer } from '../../model';
import { CustomerReservation } from '../CustomerReservation';
import { BookOnline, Payment, Schedule, Person } from '@mui/icons-material';

interface ReservationStepProps {
    onStepComplete: () => void;
}

export const ReservationStep: React.FC<ReservationStepProps> = ({ onStepComplete }) => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const { transaction } = useWorkflowSteps(transaction_id || '');

    // Customer state
    const [assignedCustomer, setAssignedCustomer] = useState<Customer | null>(null);

    // Reservation state
    const [customerNotified, setCustomerNotified] = useState(false);
    const [reservationExpires, setReservationExpires] = useState('');

    // Calculate default expiration (7 days from now)
    useEffect(() => {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        setReservationExpires(expirationDate.toISOString().split('T')[0]);
    }, []);

    // Load existing customer data if available
    useEffect(() => {
        if (transaction?.Customer) {
            setAssignedCustomer(transaction.Customer as Customer);
        }
    }, [transaction]);

    const handleCustomerAssigned = (customer: Customer) => {
        setAssignedCustomer(customer);
        // CustomerReservation modal handles deposit collection automatically
        // Don't automatically set customerNotified - let user confirm they've notified the customer
    };

    const handleCustomerNotification = async (notified: boolean) => {
        setCustomerNotified(notified);
    };

    const handleAdvanceStep = async () => {
        if (canAdvance) {
            // In the new system, WorkflowSteps only tracks completion
            // Business data would be saved to transaction metadata/notes
            onStepComplete();
        }
    };

    const isReserved = transaction?.is_reserved || false;
    const canAdvance = isReserved && customerNotified;
    const bike = transaction?.Bike;
    const customer = assignedCustomer || transaction?.Customer;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                <BookOnline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Customer Reservation
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Assign a customer to the bike and secure it with a deposit and reservation details.
            </Typography>

            {/* Customer Assignment Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Customer Assignment
                        </Typography>
                        {(assignedCustomer || transaction?.is_reserved) && (
                            <Chip
                                label="Reserved"
                                color="success"
                                size="small"
                            />
                        )}
                    </Box>

                    {customer && transaction?.is_reserved ? (
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {customer.first_name} {customer.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {customer.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {customer.phone}
                            </Typography>

                            <Alert severity="success" sx={{ mt: 2 }}>
                                ✅ Bike is reserved for this customer with deposit paid.
                            </Alert>
                        </Box>
                    ) : (
                        <Box>
                            {customer && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Current customer assigned to this transaction:
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {customer.first_name} {customer.last_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {customer.email} | {customer.phone}
                                    </Typography>
                                </Box>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {customer
                                    ? "Complete the reservation by collecting deposit and confirming details."
                                    : "Reserve this bike for a customer. The reservation includes customer assignment and deposit collection."
                                }
                            </Typography>

                            {transaction_id && (
                                <CustomerReservation
                                    transaction_id={transaction_id}
                                    transaction={transaction}
                                    onCustomerAssigned={handleCustomerAssigned}
                                    buttonText={customer ? "Complete Reservation" : "Reserve Bike for Customer"}
                                    variant="contained"
                                />
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Customer & Bike Summary */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Reservation Summary</Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                            <Typography variant="body1">
                                {customer?.first_name} {customer?.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {customer?.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {customer?.phone}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Bike</Typography>
                            <Typography variant="body1">
                                {bike?.make} {bike?.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Type: {bike?.bike_type} | Size: {bike?.size_cm}cm
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Condition: {bike?.condition}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Deposit Status (Read-only) */}
            {transaction?.is_reserved && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            <Payment sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Deposit Status
                        </Typography>

                        <Alert severity="success" sx={{ mb: 2 }}>
                            ✅ Deposit of $50 has been collected. Bike is reserved for customer.
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Reservation Details */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Reservation Timeline
                    </Typography>

                    <TextField
                        label="Reservation Expires"
                        type="date"
                        value={reservationExpires}
                        onChange={(e) => setReservationExpires(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2, width: 200 }}
                        helperText="Customer has until this date to complete purchase"
                    />

                    <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={customerNotified}
                                    onChange={(e) => handleCustomerNotification(e.target.checked)}
                                />
                            }
                            label="Customer notified about reservation and pickup timeline"
                        />
                    </Box>

                    {customerNotified && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Customer has been notified. They can complete the purchase anytime before the expiration date.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Reservation Status */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                    label={isReserved ? 'Deposit Paid & Reserved' : 'Awaiting Reservation'}
                    color={isReserved ? 'success' : 'warning'}
                    variant="filled"
                />
                <Chip
                    label={customerNotified ? 'Customer Notified' : 'Pending Notification'}
                    color={customerNotified ? 'success' : 'default'}
                    variant={customerNotified ? 'filled' : 'outlined'}
                />
                <Chip
                    label={`Reserved until ${new Date(reservationExpires).toLocaleDateString()}`}
                    color="info"
                    variant="outlined"
                />
            </Box>

            {/* Success Message */}
            {canAdvance && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        🎉 Bike successfully reserved! Customer can now complete their purchase when ready.
                    </Typography>
                </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Step 4 of 5: Customer Assignment & Reservation
                </Typography>

                <Button
                    variant="contained"
                    onClick={handleAdvanceStep}
                    disabled={!canAdvance}
                    size="large"
                >
                    Ready for Checkout →
                </Button>
            </Box>
        </Box>
    );
};
