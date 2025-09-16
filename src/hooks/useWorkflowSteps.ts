import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import DBModel, { WorkflowStep, WorkflowProgress } from '../model';

// Query keys for React Query
const QUERY_KEYS = {
  workflow: (transactionId: string) => ['workflow', transactionId],
  workflowProgress: (transactionId: string) => ['workflow-progress', transactionId],
  workflowSteps: (transactionId: string) => ['workflow-steps', transactionId],
  transaction: (transactionId: string) => ['transaction', transactionId],
} as const;

export const useWorkflowSteps = (numericTransactionId: string) => {
  const queryClient = useQueryClient();

  // First fetch the transaction to get the UUID
  const transactionQuery = useQuery({
    queryKey: QUERY_KEYS.transaction(numericTransactionId),
    queryFn: () => DBModel.fetchTransaction(numericTransactionId),
    enabled: !!numericTransactionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Use the UUID from the transaction for workflow operations
  const transactionUuid = transactionQuery.data?.transaction_id;

  // Fetch workflow progress (only when we have the UUID)
  const progressQuery = useQuery({
    queryKey: QUERY_KEYS.workflowProgress(transactionUuid || ''),
    queryFn: () => DBModel.fetchWorkflowProgress(transactionUuid!),
    enabled: !!transactionUuid,
    retry: (failureCount, error) => {
      // Don't retry on JSON parse errors (HTML responses), 404s, or workflow endpoint errors
      if (error instanceof SyntaxError || 
          (error instanceof Error && (
            error.message.includes('Unexpected token') ||
            error.message.includes('endpoint not found') ||
            error.message.includes('HTTP 404')
          ))) {
        return false;
      }
      // Only retry on actual network errors, not on API errors
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        return failureCount < 2;
      }
      return false;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch workflow steps (only when we have the UUID)
  const stepsQuery = useQuery({
    queryKey: QUERY_KEYS.workflowSteps(transactionUuid || ''),
    queryFn: () => DBModel.fetchWorkflowSteps(transactionUuid!, 'bike_sales'),
    enabled: !!transactionUuid,
    retry: (failureCount, error) => {
      // Don't retry on JSON parse errors (HTML responses), 404s, or workflow endpoint errors
      if (error instanceof SyntaxError || 
          (error instanceof Error && (
            error.message.includes('Unexpected token') ||
            error.message.includes('endpoint not found') ||
            error.message.includes('HTTP 404')
          ))) {
        return false;
      }
      // Only retry on actual network errors, not on API errors
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        return failureCount < 2;
      }
      return false;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Auto-complete any Reservation steps since we're removing them from the workflow
  useEffect(() => {
    const reservationStep = stepsQuery.data?.find(step => step.step_name === 'Reservation');
    if (reservationStep && !reservationStep.is_completed) {
      // Automatically mark the reservation step as complete to skip it
      DBModel.completeWorkflowStep(reservationStep.step_id).catch(console.error);
    }
  }, [stepsQuery.data]);

  // Initialize workflow mutation
  const initializeWorkflowMutation = useMutation({
    mutationFn: ({ transactionUuid, createdBy }: { transactionUuid: string; createdBy?: string }) =>
      DBModel.initializeWorkflow(transactionUuid, createdBy),
    onSuccess: (data) => {
      // Update the steps cache
      queryClient.setQueryData(QUERY_KEYS.workflowSteps(transactionUuid || ''), data);
      // Refetch progress
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowProgress(transactionUuid || '') });
    },
  });

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: (stepId: string) => DBModel.completeWorkflowStep(stepId),
    onSuccess: (updatedStep) => {
      // Update the steps cache optimistically
      queryClient.setQueryData(QUERY_KEYS.workflowSteps(transactionUuid || ''), (oldSteps: WorkflowStep[] | undefined) => {
        if (!oldSteps) return oldSteps;
        return oldSteps.map(step => 
          step.step_id === updatedStep.step_id ? updatedStep : step
        );
      });
      
      // Update progress cache optimistically
      queryClient.setQueryData(QUERY_KEYS.workflowProgress(transactionUuid || ''), (oldProgress: WorkflowProgress | undefined) => {
        if (!oldProgress) return oldProgress;
        const newCompletedSteps = oldProgress.completed_steps + 1;
        return {
          ...oldProgress,
          completed_steps: newCompletedSteps,
          progress_percentage: Math.round((newCompletedSteps / oldProgress.total_steps) * 100),
          is_workflow_complete: newCompletedSteps === oldProgress.total_steps,
        };
      });
    },
  });

  // Uncomplete step mutation
  const uncompleteStepMutation = useMutation({
    mutationFn: (stepId: string) => DBModel.uncompleteWorkflowStep(stepId),
    onSuccess: (updatedStep) => {
      // Update the steps cache optimistically
      queryClient.setQueryData(QUERY_KEYS.workflowSteps(transactionUuid || ''), (oldSteps: WorkflowStep[] | undefined) => {
        if (!oldSteps) return oldSteps;
        return oldSteps.map(step => 
          step.step_id === updatedStep.step_id ? updatedStep : step
        );
      });
      
      // Update progress cache optimistically
      queryClient.setQueryData(QUERY_KEYS.workflowProgress(transactionUuid || ''), (oldProgress: WorkflowProgress | undefined) => {
        if (!oldProgress) return oldProgress;
        const newCompletedSteps = Math.max(0, oldProgress.completed_steps - 1);
        return {
          ...oldProgress,
          completed_steps: newCompletedSteps,
          progress_percentage: Math.round((newCompletedSteps / oldProgress.total_steps) * 100),
          is_workflow_complete: false,
        };
      });
    },
  });

  // Reset workflow mutation
  const resetWorkflowMutation = useMutation({
    mutationFn: (transactionUuid: string) => DBModel.resetWorkflow(transactionUuid),
    onSuccess: () => {
      // Invalidate all workflow-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowSteps(transactionUuid || '') });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workflowProgress(transactionUuid || '') });
    },
  });

  // Helper functions
  const canProceedToStep = (stepName: string): boolean => {
    const orderedSteps = ['BikeSpec', 'Build', 'Creation', 'Checkout'];
    const targetIndex = orderedSteps.indexOf(stepName);
    const currentStep = getCurrentStep();
    
    if (!currentStep) return stepName === 'BikeSpec';
    
    const currentIndex = orderedSteps.indexOf(currentStep.step_name);
    
    // Can proceed to the next step if we're currently on the previous step
    // For example: if current is BikeSpec (index 0), can proceed to Build (index 1)
    return targetIndex === currentIndex + 1;
  };

  const getCurrentStep = (): WorkflowStep | null => {
    if (stepsQuery.data?.length) {
      // Frontend wants: BikeSpec(1), Build(2), Creation(3), Checkout(4)  
      // Skip Reservation step if it exists - we're removing it from the workflow
      const frontendOrder = ['BikeSpec', 'Build', 'Creation', 'Checkout'];
      
      // Find the first incomplete step in our desired frontend order
      for (const stepName of frontendOrder) {
        const step = stepsQuery.data.find(s => s.step_name === stepName);
        if (step && !step.is_completed) {
          return step;
        }
      }
      
      // If all steps are complete, return the last one in frontend order
      const lastStepName = frontendOrder[frontendOrder.length - 1];
      return stepsQuery.data.find(s => s.step_name === lastStepName) || null;
    }
    
    return null;
  };

  const getStepByName = (stepName: string): WorkflowStep | undefined => {
    return stepsQuery.data?.find(step => step.step_name === stepName);
  };

  const isStepCompleted = (stepName: string): boolean => {
    const step = getStepByName(stepName);
    return step?.is_completed || false;
  };

  const initializeWorkflow = (createdBy?: string) => {
    if (!transactionUuid) {
      throw new Error('No transaction UUID available for workflow initialization');
    }
    return initializeWorkflowMutation.mutateAsync({ transactionUuid, createdBy });
  };

  const markStepComplete = (stepId: string) => {
    return completeStepMutation.mutateAsync(stepId);
  };

  const markStepIncomplete = (stepId: string) => {
    return uncompleteStepMutation.mutateAsync(stepId);
  };

  const resetWorkflow = () => {
    if (!transactionUuid) {
      throw new Error('No transaction UUID available for workflow reset');
    }
    return resetWorkflowMutation.mutateAsync(transactionUuid);
  };

  return {
    // Data
    transaction: transactionQuery.data,
    progress: progressQuery.data,
    steps: stepsQuery.data || [],
    
    // Loading states
    isLoadingTransaction: transactionQuery.isLoading,
    isLoadingProgress: progressQuery.isLoading,
    isLoadingSteps: stepsQuery.isLoading,
    isLoading: transactionQuery.isLoading || progressQuery.isLoading || stepsQuery.isLoading,
    
    // Mutation states
    isInitializing: initializeWorkflowMutation.isPending,
    isCompletingStep: completeStepMutation.isPending,
    isUncompletingStep: uncompleteStepMutation.isPending,
    isResettingWorkflow: resetWorkflowMutation.isPending,
    
    // Error states
    transactionError: transactionQuery.error,
    progressError: progressQuery.error,
    stepsError: stepsQuery.error,
    error: transactionQuery.error || progressQuery.error || stepsQuery.error || 
           initializeWorkflowMutation.error || completeStepMutation.error || uncompleteStepMutation.error || resetWorkflowMutation.error,
    
    // Actions
    initializeWorkflow,
    markStepComplete,
    markStepIncomplete,
    resetWorkflow,
    
    // Helpers
    canProceedToStep,
    getCurrentStep,
    getStepByName,
    isStepCompleted,
    
    // Refetch functions
    refetchTransaction: transactionQuery.refetch,
    refetchProgress: progressQuery.refetch,
    refetchSteps: stepsQuery.refetch,
  };
};

export type UseWorkflowStepsResult = ReturnType<typeof useWorkflowSteps>;
