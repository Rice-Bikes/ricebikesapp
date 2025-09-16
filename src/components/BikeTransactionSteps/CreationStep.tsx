import React, { useState, useEffect } from 'react';

import {
    Box, Button, Typography, Alert, Card, CardContent,
    FormControlLabel, Checkbox, Chip, Divider, ButtonGroup, Stack
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useWorkflowSteps } from '../../hooks/useWorkflowSteps';
import { useCurrentUser } from '../../hooks/useUserQuery';
import { CustomerReservation } from '../CustomerReservation';
import { VerifiedUser, ArrowBack, ArrowForward, Warning } from '@mui/icons-material';
import { User } from '../../model';

interface CreationStepProps {
    onStepComplete: () => void;
}

// Permission check utility
const checkUserPermissions = (user: User, permissionName: string): boolean => {
    const permissions = user?.permissions?.find((perm) => perm.name === permissionName);
    return permissions ? true : false;
};

export const CreationStep: React.FC<CreationStepProps> = ({ onStepComplete }) => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const { transaction, getStepByName, markStepIncomplete, steps } = useWorkflowSteps(transaction_id || '');
    const currentUser = useCurrentUser();

    const [safetyCheckPassed, setSafetyCheckPassed] = useState(false);
    const [qualityApproved, setQualityApproved] = useState(false);

    // Permission checks
    const canSafetyCheck = currentUser ? checkUserPermissions(currentUser, "safetyCheckBikes") : false;

    // Load existing data if available
    useEffect(() => {
        const currentStep = getStepByName('Creation');
        if (currentStep?.is_completed) {
            setSafetyCheckPassed(true);
            setQualityApproved(true);
        }
    }, [getStepByName]);

    const handleSafetyCheckChange = (passed: boolean) => {
        setSafetyCheckPassed(passed);
        if (!passed) {
            setQualityApproved(false); // Can't approve quality if safety check fails
        }
    };

    const handleQualityApprovalChange = (approved: boolean) => {
        setQualityApproved(approved);
    };

    const handleAdvanceStep = async () => {
        if (canAdvance) {
            onStepComplete();
        }
    };

    const handleRevertStep = async (stepName: string) => {
        const step = getStepByName(stepName);
        if (step && step.is_completed) {
            try {
                await markStepIncomplete(step.step_id);
                // You might want to show a success message here
            } catch (error) {
                console.error('Error reverting step:', error);
                // You might want to show an error message here
            }
        }
    };

    const bike = transaction?.Bike;
    const canAdvance = safetyCheckPassed && qualityApproved && canSafetyCheck;

    // Get completed steps for reversion options
    const completedSteps = steps.filter(step => step.is_completed);
    const revertibleSteps = completedSteps.filter(step =>
        ['BikeSpec', 'Build'].includes(step.step_name)
    );

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
                Safety Check & Quality Approval
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Perform safety inspection and quality approval. Only authorized personnel can approve bikes to move forward.
            </Typography>

            {/* Permission Check Alert */}
            {!canSafetyCheck && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        ⚠️ You do not have safety check permissions. Only users with "safetyCheckBikes" permission can approve this step.
                    </Typography>
                </Alert>
            )}

            {/* Current User Info */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Inspector Information
                    </Typography>
                    <Typography variant="body1">
                        <strong>Inspector:</strong> {currentUser?.firstname} {currentUser?.lastname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Safety Check Authorization: {canSafetyCheck ? (
                            <Chip label="Authorized" color="success" size="small" />
                        ) : (
                            <Chip label="Not Authorized" color="error" size="small" />
                        )}
                    </Typography>
                </CardContent>
            </Card>

            {/* Bike Review Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                            Bike Configuration
                        </Typography>
                        {bike && (
                            <Chip
                                label="Configured"
                                color="success"
                                size="small"
                            />
                        )}
                    </Box>

                    {bike ? (
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {bike.make} {bike.model}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Type: {bike.bike_type} | Size: {bike.size_cm}cm
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Condition: {bike.condition}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Price: ${bike.price || 'TBD'}
                            </Typography>
                        </Box>
                    ) : (
                        <Alert severity="warning">
                            No bike configuration found. Please complete the previous steps.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Safety Check Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Safety Inspection
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Verify all safety-critical components are properly installed and functioning.
                    </Typography>
                    <Stack spacing={2} direction={'row'}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={safetyCheckPassed}
                                    onChange={(e) => handleSafetyCheckChange(e.target.checked)}
                                    disabled={!canSafetyCheck}
                                />
                            }
                            label="All safety checks passed - bike is safe to ride"
                            sx={{ mb: 2 }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={qualityApproved}
                                    onChange={(e) => handleQualityApprovalChange(e.target.checked)}
                                    disabled={!canSafetyCheck || !safetyCheckPassed}
                                />
                            }
                            label="Quality approved - bike meets sale standards"
                        />
                    </Stack>
                    {safetyCheckPassed && qualityApproved && canSafetyCheck && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            ✅ Bike approved for sale
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Customer Reservation Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Customer Reservation (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Reserve this bike for a customer after confirming build quality and safety.
                        Customer reservations can be made at any time during the process.
                    </Typography>
                    {transaction_id && (
                        <CustomerReservation
                            transaction_id={transaction_id}
                            transaction={transaction}
                            buttonText="Reserve for Customer"
                            variant="outlined"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Step Management Section */}
            {canSafetyCheck && revertibleSteps.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Step Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            If issues are found during safety check, you can revert previous steps to address problems.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {revertibleSteps.map(step => (
                                <Button
                                    key={step.step_id}
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    startIcon={<ArrowBack />}
                                    onClick={() => handleRevertStep(step.step_name)}
                                >
                                    Revert {step.step_name}
                                </Button>
                            ))}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Reverting a step will mark it as incomplete and may require rework.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Step 3 of 5: Safety Check & Quality Approval
                </Typography>

                <ButtonGroup>
                    <Button
                        variant="contained"
                        onClick={handleAdvanceStep}
                        disabled={!canAdvance}
                        size="large"
                        startIcon={<ArrowForward />}
                    >
                        Approve & Proceed to Checkout →
                    </Button>
                </ButtonGroup>
            </Box>
        </Box>
    );
};
