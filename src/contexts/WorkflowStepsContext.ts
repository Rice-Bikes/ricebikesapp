import { createContext } from 'react';
import { Transaction, WorkflowStep, WorkflowProgress } from '../model';

// Bike-specific step types for type safety
export type BikeStepType = 'Creation' | 'Build' | 'Checkout';

export interface WorkflowStepsContextType {
  steps: WorkflowStep[];
  transaction: Transaction | null;
  progress: WorkflowProgress | null;
  loading: boolean;
  error: string | null;
  
  // Process management
  loadWorkflow: (transactionId: string) => Promise<void>;
  initializeWorkflow: (transactionId: string) => Promise<void>;
  
  // Step management
  markStepComplete: (stepId: string) => Promise<void>;
  markStepIncomplete: (stepId: string) => Promise<void>;
  
  // Step navigation
  canProceedToStep: (stepName: string) => boolean;
  getCurrentStep: () => WorkflowStep | null;
  getStepByName: (stepName: string) => WorkflowStep | undefined;
  isStepCompleted: (stepName: string) => boolean;
}

export const WorkflowStepsContext = createContext<WorkflowStepsContextType | undefined>(undefined);
