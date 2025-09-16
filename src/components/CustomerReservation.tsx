import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    Chip, Card, CardContent, Autocomplete, TextField, FormControl,
    createFilterOptions, CircularProgress, Alert
} from '@mui/material';
import { BookmarkBorder, Person, Check, AttachMoney } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import DBModel, { Customer, CreateCustomer, Transaction } from '../model';
import { queryClient } from '../app/queryClient';
import { toast } from 'react-toastify';

interface CustomerReservationProps {
    transaction_id: string;
    transaction?: Transaction | null;
    onCustomerAssigned?: (customer: Customer) => void;
    buttonText?: string;
    disabled?: boolean;
    variant?: 'contained' | 'outlined' | 'text';
    isFinalStep?: boolean;
}

const filter = createFilterOptions<string>();

export const CustomerReservation: React.FC<CustomerReservationProps> = ({
    transaction_id,
    transaction,
    onCustomerAssigned,
    buttonText = "Reserve for Customer",
    disabled = false,
    variant = "contained",
    isFinalStep = false,
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [depositConfirmOpen, setDepositConfirmOpen] = useState(false);
    const [formState, setFormState] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
    });
    const [customers, setCustomers] = useState<Customer[]>();
    const [autocompleted, setAutocompleted] = useState("");
    const [isReserved, setIsReserved] = useState(false);
    const [assignedCustomer, setAssignedCustomer] = useState<Customer | null>(null);

    // Check if transaction is already reserved
    useEffect(() => {
        if (transaction) {
            setIsReserved(transaction.is_reserved || false);
            if (transaction.Customer) {
                setAssignedCustomer(transaction.Customer as Customer);
            }
        }
    }, [transaction]);

    // Fetch customers for autocomplete
    const { status, data, error } = useQuery({
        queryKey: ["customers"],
        queryFn: () => DBModel.fetchCustomers(),
        select: (data) => data as Customer[]
    });

    useEffect(() => {
        if (data && status === "success") {
            setCustomers(data);
        }
    }, [data, status]);

    if (error) {
        console.error("Error fetching customers", error);
        toast.error("Error fetching customers");
    }

    const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormState((prevFormState) => ({ ...prevFormState, [name]: value }));
    };

    // Create new customer
    const createCustomer = useMutation({
        mutationFn: (newCustomer: CreateCustomer) => {
            return DBModel.createCustomer(newCustomer);
        },
        onSuccess: (data: Customer) => {
            queryClient.invalidateQueries({
                queryKey: ["customers"],
            });
            // Update transaction with new customer
            updateTransactionWithCustomer(data.customer_id);
        },
        onError: (error) => {
            console.error("Error creating customer", error);
            toast.error("Error creating customer");
        },
    });

    // Update existing customer
    const updateCustomer = useMutation({
        mutationFn: (updatedCustomer: Customer) => {
            return DBModel.updateCustomer(updatedCustomer);
        },
        onSuccess: (data: Customer) => {
            queryClient.invalidateQueries({
                queryKey: ["customers"],
            });
            // Update transaction with existing customer after successful update
            updateTransactionWithCustomer(data.customer_id);
        },
        onError: (error) => {
            console.error("Error updating customer", error);
            toast.error("Error updating customer");
        }
    });

    // Update transaction with customer reservation
    const updateTransactionWithCustomer = async (customer_id: string) => {
        if (!transaction) return;

        try {
            // Update transaction to mark as reserved and assign customer
            await DBModel.updateTransaction(transaction_id, {
                transaction_type: transaction.transaction_type,
                customer_id: customer_id, // Add customer to transaction
                bike_id: transaction.bike_id,
                total_cost: typeof transaction.total_cost === 'number'
                    ? transaction.total_cost
                    : parseFloat(transaction.total_cost as string) || 0,
                description: transaction.description,
                is_completed: transaction.is_completed,
                is_paid: transaction.is_paid,
                is_refurb: transaction.is_refurb,
                is_urgent: transaction.is_urgent,
                is_nuclear: transaction.is_nuclear,
                is_beer_bike: transaction.is_beer_bike,
                is_reserved: true, // Mark transaction as reserved
                is_waiting_on_email: transaction.is_waiting_on_email,
                date_completed: transaction.date_completed
            });

            // Update the bike to set deposit amount and mark as unavailable
            if (transaction.bike_id) {
                await DBModel.updateBike(transaction.bike_id, {
                    deposit_amount: 50.00, // Set $50 deposit
                    is_available: false // Mark bike as reserved/unavailable
                });
            }

            // Find the customer that was just assigned
            const customer = customers?.find(c => c.customer_id === customer_id);
            if (customer) {
                setAssignedCustomer(customer);
                setIsReserved(true);
                onCustomerAssigned?.(customer);
                toast.success(`Bike reserved for ${customer.first_name} ${customer.last_name}`);
            }

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['transaction', transaction_id] });
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error updating transaction with customer:', error);
            toast.error('Error reserving bike for customer');
        }
    };

    const resetForm = () => {
        setFormState({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
        });
        setAutocompleted("");
    };

    const handleReserve = () => {
        if (isFinalStep) {
            // For final step, directly proceed with reservation without confirmation dialog
            handleConfirmDeposit();
        } else {
            // Show deposit confirmation dialog instead of immediately processing
            setDepositConfirmOpen(true);
        }
    };

    const handleConfirmDeposit = () => {
        const newCustomer: CreateCustomer = {
            first_name: formState.first_name,
            last_name: formState.last_name,
            email: formState.email,
            phone: formState.phone,
        };

        if (autocompleted.length > 0) {
            // Update existing customer - updateTransactionWithCustomer will be called in onSuccess
            updateCustomer.mutate({
                customer_id: autocompleted,
                ...newCustomer,
            });
        } else {
            // Create new customer - updateTransactionWithCustomer will be called in onSuccess
            createCustomer.mutate(newCustomer);
        }

        // Close deposit confirmation dialog
        setDepositConfirmOpen(false);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleReserve();
    };

    const handleUnreserve = async () => {
        if (!transaction) return;

        try {
            // Prepare update data without customer_id field to remove customer association
            const updateData: Omit<Parameters<typeof DBModel.updateTransaction>[1], 'customer_id'> = {
                transaction_type: transaction.transaction_type,
                bike_id: transaction.bike_id,
                total_cost: typeof transaction.total_cost === 'number'
                    ? transaction.total_cost
                    : parseFloat(transaction.total_cost as string) || 0,
                description: transaction.description,
                is_completed: transaction.is_completed,
                is_paid: transaction.is_paid,
                is_refurb: transaction.is_refurb,
                is_urgent: transaction.is_urgent,
                is_nuclear: transaction.is_nuclear,
                is_beer_bike: transaction.is_beer_bike,
                is_reserved: false, // Mark transaction as not reserved
                is_waiting_on_email: transaction.is_waiting_on_email,
                date_completed: transaction.date_completed
            };
            // Explicitly omit customer_id field instead of setting to null

            console.log('Attempting to unreserve with data:', updateData);
            await DBModel.updateTransaction(transaction_id, updateData);

            // Clear bike deposit and make available again
            if (transaction.bike_id) {
                await DBModel.updateBike(transaction.bike_id, {
                    deposit_amount: 0, // Clear deposit
                    is_available: true // Make bike available again
                });
            }

            setAssignedCustomer(null);
            setIsReserved(false);
            toast.success('Bike reservation removed');

            // Invalidate transaction query to refresh data
            queryClient.invalidateQueries({ queryKey: ['transaction', transaction_id] });
        } catch (error) {
            console.error('Error removing reservation:', error);
            toast.error('Error removing reservation');
        }
    };

    if (isReserved && assignedCustomer) {
        return (
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Check color="success" />
                            <Box>
                                <Typography variant="subtitle2">
                                    Reserved for {assignedCustomer.first_name} {assignedCustomer.last_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {assignedCustomer.email} • {assignedCustomer.phone}
                                </Typography>
                            </Box>
                            <Chip
                                label="Reserved"
                                color="success"
                                size="small"
                            />
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleUnreserve}
                            color="warning"
                        >
                            Remove Reservation
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Button
                startIcon={<BookmarkBorder />}
                variant={variant}
                onClick={() => setDialogOpen(true)}
                disabled={disabled}
            >
                {buttonText}
            </Button>

            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person />
                        Reserve Bike for Customer
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {customers === undefined ? (
                        <CircularProgress />
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <FormControl sx={{ width: "100%" }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Enter customer information or select an existing customer by email.
                                    </Typography>

                                    <Autocomplete
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                type="email"
                                                name="email"
                                                onChange={handleTextFieldChange}
                                                label="Email Address"
                                                value={formState.email}
                                                required
                                            />
                                        )}
                                        options={customers.map((customer) => customer.email)}
                                        onChange={(_, value, reason) => {
                                            if (reason === "selectOption") {
                                                const customer = customers.find(
                                                    (customer) => customer.email === value
                                                );
                                                if (customer) {
                                                    console.log("Autocompleted customer:", customer);
                                                    setFormState({
                                                        first_name: customer.first_name,
                                                        last_name: customer.last_name,
                                                        email: customer.email,
                                                        phone: customer.phone ?? '',
                                                    });
                                                    setAutocompleted(customer.customer_id);
                                                }
                                            } else {
                                                setFormState({
                                                    first_name: "",
                                                    last_name: "",
                                                    email: value ?? "",
                                                    phone: "",
                                                });
                                                setAutocompleted("");
                                            }
                                            if (reason === "blur") {
                                                setAutocompleted("");
                                            }
                                        }}
                                        filterOptions={(options, params) => {
                                            const filtered = filter(options, params);
                                            const { inputValue } = params;
                                            const isExisting = options.some((option) => inputValue === option);
                                            if (inputValue !== '' && !isExisting) {
                                                filtered.push(`${inputValue}`);
                                            }
                                            return filtered;
                                        }}
                                        fullWidth
                                    />

                                    <TextField
                                        type="text"
                                        name="first_name"
                                        label="First Name"
                                        value={formState.first_name}
                                        onChange={handleTextFieldChange}
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        type="text"
                                        name="last_name"
                                        label="Last Name"
                                        value={formState.last_name}
                                        onChange={handleTextFieldChange}
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        type="text"
                                        name="phone"
                                        label="Phone Number"
                                        value={formState.phone}
                                        onChange={handleTextFieldChange}
                                        fullWidth
                                        required
                                    />
                                </Box>
                            </FormControl>
                        </form>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleReserve()}
                        variant="contained"
                        disabled={!formState.email || !formState.first_name || !formState.last_name || !formState.phone}
                    >
                        Reserve Bike for Customer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Deposit Confirmation Dialog */}
            <Dialog
                open={depositConfirmOpen && !isFinalStep}
                onClose={() => setDepositConfirmOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney />
                        Confirm Deposit Charge
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        A deposit of <strong>$50.00</strong> will be charged to secure this bike reservation.
                    </Alert>

                    <Typography variant="body1" gutterBottom>
                        <strong>Customer:</strong> {formState.first_name} {formState.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Email:</strong> {formState.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Phone:</strong> {formState.phone}
                    </Typography>

                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                            By confirming, you acknowledge that a $50.00 deposit will be charged and the bike will be reserved for this customer.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setDepositConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDeposit}
                        variant="contained"
                        color="primary"
                        startIcon={<AttachMoney />}
                    >
                        Confirm $50 Deposit & Reserve
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
