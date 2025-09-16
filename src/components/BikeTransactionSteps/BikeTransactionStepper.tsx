import React from 'react';
import {
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Box,
    Typography,
    LinearProgress
} from '@mui/material';
import { BikeTransactionStep } from '../../types/BikeTransaction';

interface BikeTransactionStepperProps {
    steps: BikeTransactionStep[];
    activeStep: number;
    completionProgress: number;
}

export const BikeTransactionStepper: React.FC<BikeTransactionStepperProps> = ({
    steps,
    activeStep,
    completionProgress
}) => {
    return (
        <Box sx={{ width: '100%', mb: 3 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Transaction Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={completionProgress}
                            sx={{ height: 8, borderRadius: 4 }}
                        />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                            {Math.round(completionProgress)}%
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step) => (
                    <Step key={step.id} completed={step.isCompleted}>
                        <StepLabel
                            optional={
                                !step.isRequired && (
                                    <Typography variant="caption">Optional</Typography>
                                )
                            }
                        >
                            <Typography variant="subtitle1">
                                {step.name}
                            </Typography>
                        </StepLabel>
                        <StepContent>
                            <Typography variant="body2" color="text.secondary">
                                {step.description}
                            </Typography>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
};
