import React, { useState } from 'react';
import {
    Box, Typography, Card, CardContent, FormGroup, FormControlLabel, Checkbox,
    Button, Alert, Paper, Chip, Grid2, TextField
} from '@mui/material';
import { EnhancedBike } from '../../types/BikeTransaction';

interface InspectionStepProps {
    bike: EnhancedBike;
    onInspectionComplete: (inspectionData: InspectionData) => void;
    existingInspection?: InspectionData;
}

export interface InspectionData {
    safetyChecks: {
        brakes: boolean;
        tires: boolean;
        chain: boolean;
        gears: boolean;
        frame: boolean;
        handlebars: boolean;
        seat: boolean;
        pedals: boolean;
        lights: boolean; // if applicable
        reflectors: boolean;
    };
    functionalChecks: {
        shifting: boolean;
        braking: boolean;
        steering: boolean;
        wheelTrueStability: boolean;
    };
    cosmeticCondition: {
        frameCondition: 'excellent' | 'good' | 'fair' | 'poor';
        componentCondition: 'excellent' | 'good' | 'fair' | 'poor';
    };
    maintenanceCompleted: {
        cleaned: boolean;
        lubricated: boolean;
        adjusted: boolean;
        repaired: boolean;
    };
    inspectionNotes: string;
    inspectorInitials: string;
    passedInspection: boolean;
}

export const InspectionStep: React.FC<InspectionStepProps> = ({
    bike,
    onInspectionComplete,
    existingInspection
}) => {
    const [inspectionData, setInspectionData] = useState<InspectionData>(
        existingInspection || {
            safetyChecks: {
                brakes: false,
                tires: false,
                chain: false,
                gears: false,
                frame: false,
                handlebars: false,
                seat: false,
                pedals: false,
                lights: false,
                reflectors: false,
            },
            functionalChecks: {
                shifting: false,
                braking: false,
                steering: false,
                wheelTrueStability: false,
            },
            cosmeticCondition: {
                frameCondition: 'good',
                componentCondition: 'good',
            },
            maintenanceCompleted: {
                cleaned: false,
                lubricated: false,
                adjusted: false,
                repaired: false,
            },
            inspectionNotes: '',
            inspectorInitials: '',
            passedInspection: false,
        }
    );

    const [errors, setErrors] = useState<string[]>([]);

    const handleSafetyCheckChange = (check: keyof InspectionData['safetyChecks']) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setInspectionData(prev => ({
            ...prev,
            safetyChecks: {
                ...prev.safetyChecks,
                [check]: event.target.checked
            }
        }));
    };

    const handleFunctionalCheckChange = (check: keyof InspectionData['functionalChecks']) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setInspectionData(prev => ({
            ...prev,
            functionalChecks: {
                ...prev.functionalChecks,
                [check]: event.target.checked
            }
        }));
    };

    const handleMaintenanceChange = (task: keyof InspectionData['maintenanceCompleted']) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setInspectionData(prev => ({
            ...prev,
            maintenanceCompleted: {
                ...prev.maintenanceCompleted,
                [task]: event.target.checked
            }
        }));
    };

    const handleConditionChange = (
        type: keyof InspectionData['cosmeticCondition'],
        value: 'excellent' | 'good' | 'fair' | 'poor'
    ) => {
        setInspectionData(prev => ({
            ...prev,
            cosmeticCondition: {
                ...prev.cosmeticCondition,
                [type]: value
            }
        }));
    };

    const validateInspection = (): boolean => {
        const newErrors: string[] = [];

        // Check if all safety checks are completed
        const safetyChecksComplete = Object.values(inspectionData.safetyChecks).every(Boolean);
        if (!safetyChecksComplete) {
            newErrors.push('All safety checks must be completed');
        }

        // Check if all functional checks are completed
        const functionalChecksComplete = Object.values(inspectionData.functionalChecks).every(Boolean);
        if (!functionalChecksComplete) {
            newErrors.push('All functional checks must be completed');
        }

        // Require inspector initials
        if (!inspectionData.inspectorInitials.trim()) {
            newErrors.push('Inspector initials are required');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = () => {
        if (validateInspection()) {
            const passedInspection =
                Object.values(inspectionData.safetyChecks).every(Boolean) &&
                Object.values(inspectionData.functionalChecks).every(Boolean);

            onInspectionComplete({
                ...inspectionData,
                passedInspection
            });
        }
    };

    const safetyCheckLabels = {
        brakes: 'Brakes (front & rear)',
        tires: 'Tires & tubes',
        chain: 'Chain condition',
        gears: 'Gear components',
        frame: 'Frame integrity',
        handlebars: 'Handlebars & stem',
        seat: 'Seat & post',
        pedals: 'Pedals',
        lights: 'Lights (if equipped)',
        reflectors: 'Reflectors'
    };

    const functionalCheckLabels = {
        shifting: 'Shifting performance',
        braking: 'Braking performance',
        steering: 'Steering alignment',
        wheelTrueStability: 'Wheel true & stability'
    };

    const maintenanceLabels = {
        cleaned: 'Bike cleaned',
        lubricated: 'Chain lubricated',
        adjusted: 'Components adjusted',
        repaired: 'Repairs completed'
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Pre-Sale Inspection
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete all safety and functional checks before finalizing the sale.
            </Typography>

            {/* Bike Info */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Inspecting: {bike.make} {bike.model}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip label={bike.condition} size="small" />
                        <Chip label={`${bike.size_cm} cm`} size="small" variant="outlined" />
                        <Chip label={bike.bike_type} size="small" variant="outlined" />
                    </Box>
                </CardContent>
            </Card>

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
                {/* Safety Checks */}
                <Grid2 size={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Safety Checklist
                            </Typography>
                            <FormGroup>
                                {Object.entries(safetyCheckLabels).map(([key, label]) => (
                                    <FormControlLabel
                                        key={key}
                                        control={
                                            <Checkbox
                                                checked={inspectionData.safetyChecks[key as keyof typeof inspectionData.safetyChecks]}
                                                onChange={handleSafetyCheckChange(key as keyof typeof inspectionData.safetyChecks)}
                                            />
                                        }
                                        label={label}
                                    />
                                ))}
                            </FormGroup>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Functional Checks */}
                <Grid2 size={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Functional Tests
                            </Typography>
                            <FormGroup>
                                {Object.entries(functionalCheckLabels).map(([key, label]) => (
                                    <FormControlLabel
                                        key={key}
                                        control={
                                            <Checkbox
                                                checked={inspectionData.functionalChecks[key as keyof typeof inspectionData.functionalChecks]}
                                                onChange={handleFunctionalCheckChange(key as keyof typeof inspectionData.functionalChecks)}
                                            />
                                        }
                                        label={label}
                                    />
                                ))}
                            </FormGroup>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Maintenance Completed */}
                <Grid2 size={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Maintenance Completed
                            </Typography>
                            <FormGroup>
                                {Object.entries(maintenanceLabels).map(([key, label]) => (
                                    <FormControlLabel
                                        key={key}
                                        control={
                                            <Checkbox
                                                checked={inspectionData.maintenanceCompleted[key as keyof typeof inspectionData.maintenanceCompleted]}
                                                onChange={handleMaintenanceChange(key as keyof typeof inspectionData.maintenanceCompleted)}
                                            />
                                        }
                                        label={label}
                                    />
                                ))}
                            </FormGroup>
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Cosmetic Condition */}
                <Grid2 size={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Cosmetic Condition
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Frame Condition
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {(['excellent', 'good', 'fair', 'poor'] as const).map(condition => (
                                        <Chip
                                            key={condition}
                                            label={condition}
                                            clickable
                                            color={inspectionData.cosmeticCondition.frameCondition === condition ? 'primary' : 'default'}
                                            onClick={() => handleConditionChange('frameCondition', condition)}
                                        />
                                    ))}
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Component Condition
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {(['excellent', 'good', 'fair', 'poor'] as const).map(condition => (
                                        <Chip
                                            key={condition}
                                            label={condition}
                                            clickable
                                            color={inspectionData.cosmeticCondition.componentCondition === condition ? 'primary' : 'default'}
                                            onClick={() => handleConditionChange('componentCondition', condition)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>

            {/* Notes & Inspector */}
            <Box sx={{ mt: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Inspection Notes & Sign-off
                        </Typography>

                        <Grid2 container spacing={2}>
                            <Grid2 size={8}>
                                <TextField
                                    label="Inspection Notes"
                                    value={inspectionData.inspectionNotes}
                                    onChange={(e) => setInspectionData(prev => ({ ...prev, inspectionNotes: e.target.value }))}
                                    multiline
                                    rows={3}
                                    fullWidth
                                    placeholder="Any additional notes about the bike's condition or maintenance performed..."
                                />
                            </Grid2>

                            <Grid2 size={4}>
                                <TextField
                                    label="Inspector Initials"
                                    value={inspectionData.inspectorInitials}
                                    onChange={(e) => setInspectionData(prev => ({ ...prev, inspectorInitials: e.target.value }))}
                                    required
                                    fullWidth
                                    inputProps={{ maxLength: 5 }}
                                />

                                <Box sx={{ mt: 2 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: inspectionData.passedInspection ? 'success.light' : 'warning.light' }}>
                                        <Typography variant="body2" textAlign="center">
                                            {Object.values(inspectionData.safetyChecks).every(Boolean) &&
                                                Object.values(inspectionData.functionalChecks).every(Boolean)
                                                ? '✅ PASSED INSPECTION'
                                                : '⚠️ INSPECTION INCOMPLETE'}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Grid2>
                        </Grid2>
                    </CardContent>
                </Card>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={
                        !Object.values(inspectionData.safetyChecks).every(Boolean) ||
                        !Object.values(inspectionData.functionalChecks).every(Boolean) ||
                        !inspectionData.inspectorInitials.trim()
                    }
                >
                    Complete Inspection
                </Button>
            </Box>
        </Box>
    );
};
