import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Typography,
    Button,
    Alert,
    LinearProgress,
    Chip,
    Card,
    CardContent,
    Menu,
    MenuItem,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from '@mui/material';
import { ArrowBack, Build, BookmarkBorder, Payment, MoreVert, Refresh, Delete, DirectionsBike, Check } from '@mui/icons-material';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { useCurrentUser } from '../../hooks/useUserQuery';
import { CreationStep } from '../../components/BikeTransactionSteps/CreationStep';
import { BuildStep } from '../../components/BikeTransactionSteps/BuildStep';
import { ReservationStep } from '../../components/BikeTransactionSteps/ReservationStep';
import { CheckoutStep } from '../../components/BikeTransactionSteps/CheckoutStep';
import { BikeSelectionStep } from '../../components/BikeTransactionSteps/BikeSelectionStep';
import { Bike } from '../../model';

const SALES_STEPS: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}> = [
        {
            key: 'BikeSpec',
            label: 'Bike Specification',
            icon: <DirectionsBike />,
            description: 'Define bike specs and requirements'
        },
        {
            key: 'Build',
            label: 'Build & Inspect',
            icon: <Build />,
            description: 'Prepare and inspect the bike'
        },
        {
            key: 'Creation',
            label: 'Confirmation and Safety Check',
            icon: <Check />,
            description: 'Confirm state of bike and check build quality before reservation'
        },
        {
            key: 'Reservation',
            label: 'Reservation',
            icon: <BookmarkBorder />,
            description: 'Customer reservation with deposit'
        },
        {
            key: 'Checkout',
            label: 'Checkout',
            icon: <Payment />,
            description: 'Final payment and completion'
        }
    ];

const BikeTransactionPageContent: React.FC = () => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const navigate = useNavigate();
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();

    const {
        transaction,
        progress,
        steps,
        error,
        isLoadingTransaction,
        canProceedToStep,
        markStepComplete,
        markStepIncomplete,
        getCurrentStep,
        getStepByName,
        initializeWorkflow,
        isInitializing,
        resetWorkflow,
        isResettingWorkflow
    } = useWorkflowSteps(transaction_id || '');

    // Admin controls state
    const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    // Check if current user is admin based on permissions
    const isAdmin = currentUser?.permissions?.some(p => p.name?.toLowerCase().includes('admin')) || false;

    const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAdminMenuAnchor(event.currentTarget);
    };

    const handleAdminMenuClose = () => {
        setAdminMenuAnchor(null);
    };

    const handleResetWorkflow = async () => {
        try {
            await resetWorkflow();
            setResetDialogOpen(false);
            handleAdminMenuClose();
        } catch (error) {
            console.error('Error resetting workflow:', error);
        }
    };

    const handleReinitializeWorkflow = async () => {
        try {
            await resetWorkflow();
            await initializeWorkflow(currentUser?.user_id);
            handleAdminMenuClose();
        } catch (error) {
            console.error('Error reinitializing workflow:', error);
        }
    };

    // No need for manual initialization - React Query handles data fetching automatically

    const currentStep = getCurrentStep();
    const currentStepIndex = SALES_STEPS.findIndex(step => step.key === currentStep?.step_name);

    const handleNext = async () => {
        console.log('handleNext called');
        console.log('currentStepIndex:', currentStepIndex);
        console.log('currentStep:', currentStep);
        console.log('SALES_STEPS.length:', SALES_STEPS.length);

        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < SALES_STEPS.length && currentStep) {
            const nextStepType = SALES_STEPS[nextStepIndex].key;
            console.log('nextStepType:', nextStepType);
            console.log('canProceedToStep(nextStepType):', canProceedToStep(nextStepType));

            if (canProceedToStep(nextStepType)) {
                console.log('Calling markStepComplete with stepId:', currentStep.step_id);
                console.log('Complete workflow step URL:', `${window.location.origin}/workflow-steps/complete/${currentStep.step_id}`);
                try {
                    await markStepComplete(currentStep.step_id);
                    console.log('markStepComplete completed successfully');
                } catch (error) {
                    console.error('Error in markStepComplete:', error);
                }
            }
        }
    };

    const handlePrevious = async () => {
        if (currentStepIndex > 0) {
            // Find the current step that we want to mark as incomplete
            const currentStepToRevert = SALES_STEPS[currentStepIndex].key;
            const stepToRevert = getStepByName(currentStepToRevert);

            if (stepToRevert) {
                try {
                    console.log('Reverting current step to go back:', currentStepToRevert);
                    // Mark the current step as incomplete to go back to the previous step
                    // This should work regardless of whether the step is currently completed or not
                    await markStepIncomplete(stepToRevert.step_id);

                    // Manually invalidate queries to ensure UI updates
                    if (transaction?.transaction_id) {
                        queryClient.invalidateQueries({ queryKey: ['workflow', transaction.transaction_id] });
                        queryClient.invalidateQueries({ queryKey: ['workflow-progress', transaction.transaction_id] });
                        queryClient.invalidateQueries({ queryKey: ['workflow-steps', transaction.transaction_id] });
                    }

                    console.log('Successfully reverted to previous step');
                } catch (error) {
                    console.error('Error reverting to previous step:', error);
                    // You might want to show an error notification here
                }
            } else {
                console.warn('Could not find step to revert:', currentStepToRevert);
            }
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const renderStepContent = () => {
        // Debug logging to understand loading states
        console.log('Debug - isLoadingTransaction:', isLoadingTransaction);
        console.log('Debug - transaction:', transaction);
        console.log('Debug - transaction_id from URL:', transaction_id);

        if (error) {
            // Check if this is a workflow API error (endpoints not implemented or no workflow exists)
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('Workflow') || errorMessage.includes('endpoint not found') ||
                errorMessage.includes('HTTP 404')) {
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                            <Typography variant="h6" gutterBottom>
                                No Workflow Found
                            </Typography>
                            <Typography>
                                This transaction (#{transaction?.transaction_num || transaction_id}) doesn't have a bike sales workflow configured yet.
                                Click the button below to initialize the standard 4-step bike sales process.
                            </Typography>
                        </Alert>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={async () => {
                                console.log('URL transaction_id:', transaction_id);
                                console.log('Transaction object:', transaction);
                                console.log('Transaction UUID (transaction_id field):', transaction?.transaction_id);
                                console.log('Transaction numeric (transaction_num field):', transaction?.transaction_num);
                                console.log('Current user:', currentUser);

                                if (!transaction?.transaction_id) {
                                    console.error('No UUID transaction_id found in transaction object');
                                    return;
                                }

                                if (!currentUser?.user_id) {
                                    console.error('No user ID found for workflow initialization');
                                    return;
                                }

                                try {
                                    await initializeWorkflow(currentUser.user_id);
                                    console.log('Workflow initialized successfully');
                                } catch (error) {
                                    console.error('Error initializing workflow:', error);
                                }
                            }}
                            disabled={isInitializing || !transaction?.transaction_id || !currentUser?.user_id}
                            sx={{ px: 4, py: 2 }}
                        >
                            {isInitializing ? 'Initializing Workflow...' : 'Initialize Bike Sales Workflow'}
                        </Button>
                    </Box>
                );
            }

            return (
                <Alert severity="error">
                    Error loading transaction: {errorMessage}
                </Alert>
            );
        }

        if (isLoadingTransaction) {
            return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography>Loading transaction...</Typography>
                </Box>
            );
        } else if (!transaction) {
            return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>No transaction found.</Typography>
                </Box>
            );
        }



        if (!currentStep) {
            return (
                <Alert severity="info">
                    No workflow steps available
                </Alert>
            );
        }

        switch (currentStep.step_name) {
            case 'BikeSpec':
                return (
                    <BikeSelectionStep
                        onBikeCreated={() => handleNext()}
                        existingBike={transaction?.Bike as Bike | undefined}
                    />
                );
            case 'Build':
                return (
                    <BuildStep
                        onStepComplete={() => handleNext()}
                    />
                );

            case 'Creation':
                return (
                    <CreationStep
                        onStepComplete={() => handleNext()}
                    />
                );

            case 'Reservation':
                return (
                    <ReservationStep
                        onStepComplete={() => handleNext()}
                    />
                );

            case 'Checkout':
                return (
                    <CheckoutStep
                        onStepComplete={() => console.log('Transaction completed!')}
                    />
                );

            default:
                return (
                    <Alert severity="error">
                        Unknown step: {currentStep.step_name}
                    </Alert>
                );
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={handleBack}
                    sx={{ mr: 2 }}
                >
                    Back to Transactions
                </Button>

                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" component="h1">
                        Bike Sales Transaction
                    </Typography>
                    {transaction && (
                        <Typography variant="body2" color="text.secondary">
                            Transaction #{transaction.transaction_num} • {
                                (transaction.Customer?.name as string) || 'Unknown Customer'
                            }
                        </Typography>
                    )}
                </Box>

                {steps.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                            label={`${steps.filter(s => s.is_completed).length}/${steps.length} COMPLETED`}
                            color="primary"
                            variant="outlined"
                        />

                        {/* Admin Controls */}
                        {isAdmin && (
                            <>
                                <IconButton
                                    onClick={handleAdminMenuOpen}
                                    size="small"
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <MoreVert />
                                </IconButton>

                                <Menu
                                    anchorEl={adminMenuAnchor}
                                    open={Boolean(adminMenuAnchor)}
                                    onClose={handleAdminMenuClose}
                                >
                                    <MenuItem onClick={handleReinitializeWorkflow} disabled={isResettingWorkflow || isInitializing}>
                                        <Refresh sx={{ mr: 1 }} />
                                        Reset & Reinitialize Workflow
                                    </MenuItem>
                                    <MenuItem onClick={() => setResetDialogOpen(true)} disabled={isResettingWorkflow}>
                                        <Delete sx={{ mr: 1 }} />
                                        Delete Workflow Steps
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                )}
            </Box>

            {/* Progress Overview */}
            {steps.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Progress Overview
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(progress?.progress_percentage || 0)}% Complete
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progress?.progress_percentage || 0}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Bike Information Card */}
            {transaction?.Bike && (
                <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DirectionsBike />
                                Bike Details
                            </Typography>
                            <Chip
                                label={transaction.Bike.condition || 'Unknown'}
                                color="primary"
                                size="small"
                            />
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Make & Model</Typography>
                                <Typography variant="body1">
                                    {transaction.Bike.make} {transaction.Bike.model}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Type & Size</Typography>
                                <Typography variant="body1">
                                    {transaction.Bike.bike_type} • {transaction.Bike.size_cm}cm
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    ${typeof transaction.Bike.price === 'number'
                                        ? transaction.Bike.price.toFixed(2)
                                        : parseFloat((transaction.Bike.price ?? '') || '0').toFixed(2)}
                                </Typography>
                            </Box>
                            {transaction.Bike.description && (
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                    <Typography variant="body2">
                                        {transaction.Bike.description}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Step Navigation */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Stepper activeStep={currentStepIndex} alternativeLabel>
                    {SALES_STEPS.map((step) => (
                        <Step key={step.key}>
                            <StepLabel
                                icon={step.icon}
                                optional={
                                    <Typography variant="caption">
                                        {step.description}
                                    </Typography>
                                }
                            >
                                {step.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Step Content */}
            <Paper sx={{ p: 3, mb: 3 }}>
                {renderStepContent()}
            </Paper>

            {/* Step Navigation Controls */}
            {steps.length > 0 && currentStep && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            {currentStepIndex > 0 && (
                                <Button
                                    variant="outlined"
                                    onClick={handlePrevious}
                                    startIcon={<ArrowBack />}
                                    sx={{ mr: 2 }}
                                >
                                    Back to {SALES_STEPS[currentStepIndex - 1].label}
                                </Button>
                            )}
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            Step {currentStepIndex + 1} of {SALES_STEPS.length}: {SALES_STEPS[currentStepIndex].label}
                        </Typography>

                        <Box>
                            {currentStepIndex < SALES_STEPS.length - 1 && (
                                <Alert severity="info" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                        Complete this step to proceed to {SALES_STEPS[currentStepIndex + 1].label}
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Admin Confirmation Dialog */}
            <Dialog
                open={resetDialogOpen}
                onClose={() => setResetDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Workflow Steps</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete all workflow steps for this transaction?
                        This action cannot be undone. The transaction will remain, but all workflow
                        progress will be lost.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResetWorkflow}
                        color="error"
                        disabled={isResettingWorkflow}
                    >
                        {isResettingWorkflow ? 'Deleting...' : 'Delete Workflow'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const BikeTransactionPage: React.FC = () => {
    const { transaction_id } = useParams<{ transaction_id: string }>();

    if (!transaction_id) {
        return (
            <Alert severity="error">
                No transaction ID provided
            </Alert>
        );
    }

    return <BikeTransactionPageContent />;
};

export { BikeTransactionPage };
