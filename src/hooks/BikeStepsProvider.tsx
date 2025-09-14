import React, { createContext, useState, ReactNode } from 'react';
import { BikeTransactionStep, BikeSaleTransaction, DEFAULT_BIKE_SALE_STEPS } from '../types/BikeTransaction';

interface BikeStepsContextType {
    currentTransaction: BikeSaleTransaction | null;
    initializeTransaction: (transactionId: string, customSteps?: BikeTransactionStep[]) => void;
    updateStepCompletion: (stepId: string, isCompleted: boolean) => void;
    moveToNextStep: () => void;
    moveToPreviousStep: () => void;
    getCurrentStep: () => BikeTransactionStep | null;
    getAllSteps: () => BikeTransactionStep[];
    getCompletionProgress: () => number;
}

const BikeStepsContext = createContext<BikeStepsContextType | undefined>(undefined);

export { BikeStepsContext };

interface BikeStepsProviderProps {
    children: ReactNode;
}

export const BikeStepsProvider: React.FC<BikeStepsProviderProps> = ({ children }) => {
    const [currentTransaction, setCurrentTransaction] = useState<BikeSaleTransaction | null>(null);

    const initializeTransaction = (_transactionId: string, customSteps?: BikeTransactionStep[]) => {
        const steps = customSteps || [...DEFAULT_BIKE_SALE_STEPS];
        setCurrentTransaction({
            steps,
            currentStepIndex: 0,
            isCompleted: false
        });
    };

    const updateStepCompletion = (stepId: string, isCompleted: boolean) => {
        if (!currentTransaction) return;

        const updatedSteps = currentTransaction.steps.map(step =>
            step.id === stepId ? { ...step, isCompleted } : step
        );

        const allCompleted = updatedSteps.every(step => step.isCompleted);

        setCurrentTransaction({
            ...currentTransaction,
            steps: updatedSteps,
            isCompleted: allCompleted
        });
    };

    const moveToNextStep = () => {
        if (!currentTransaction) return;

        const nextIndex = Math.min(
            currentTransaction.currentStepIndex + 1,
            currentTransaction.steps.length - 1
        );

        setCurrentTransaction({
            ...currentTransaction,
            currentStepIndex: nextIndex
        });
    };

    const moveToPreviousStep = () => {
        if (!currentTransaction) return;

        const prevIndex = Math.max(currentTransaction.currentStepIndex - 1, 0);

        setCurrentTransaction({
            ...currentTransaction,
            currentStepIndex: prevIndex
        });
    };

    const getCurrentStep = (): BikeTransactionStep | null => {
        if (!currentTransaction) return null;
        return currentTransaction.steps[currentTransaction.currentStepIndex] || null;
    };

    const getAllSteps = (): BikeTransactionStep[] => {
        return currentTransaction?.steps || [];
    };

    const getCompletionProgress = (): number => {
        if (!currentTransaction) return 0;

        const completedSteps = currentTransaction.steps.filter(step => step.isCompleted).length;
        return (completedSteps / currentTransaction.steps.length) * 100;
    };

    return (
        <BikeStepsContext.Provider value={{
            currentTransaction,
            initializeTransaction,
            updateStepCompletion,
            moveToNextStep,
            moveToPreviousStep,
            getCurrentStep,
            getAllSteps,
            getCompletionProgress
        }}>
            {children}
        </BikeStepsContext.Provider>
    );
};
