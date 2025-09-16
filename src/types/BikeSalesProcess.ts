// Bike Sales Process Types
export type BikeSalesStep = 
  | 'creation'     // Create transaction & select bike
  | 'build'        // Build/prepare bike (includes inspection)
  | 'checkout';    // Final payment & completion

export type BikeSalesStatus = 
  | 'in_progress'  // Currently being worked on
  | 'waiting'      // Waiting for customer or next step
  | 'completed'    // Fully completed
  | 'cancelled';   // Cancelled/abandoned

export interface BikeSalesProcess {
  transaction_id: string;
  current_step: BikeSalesStep;
  status: BikeSalesStatus;
  created_at: string;
  updated_at: string;
  assigned_to?: string;  // User ID of who's working on it
  step_data: {
    creation?: {
      bike_selected: boolean;
      customer_confirmed: boolean;
      completed_at?: string;
    };
    build?: {
      started_at?: string;
      inspection_completed: boolean;
      quality_check_passed: boolean;
      notes?: string;
      completed_at?: string;
      inspector_id?: string;
    };

    checkout?: {
      final_amount: number;
      payment_completed: boolean;
      completed_at?: string;
    };
  };
}

export interface BikeSalesStepUpdate {
  step: BikeSalesStep;
  status: BikeSalesStatus;
  assigned_to?: string;
  step_data?: Partial<BikeSalesProcess['step_data']>;
}

export interface CreateBikeSalesProcessRequest {
  transaction_id: string;
  assigned_to?: string;
}

// Step validation functions
export const isStepComplete = (process: BikeSalesProcess, step: BikeSalesStep): boolean => {
  switch (step) {
    case 'creation':
      return !!(process.step_data.creation?.bike_selected && 
                process.step_data.creation?.customer_confirmed);
    case 'build':
      return !!(process.step_data.build?.inspection_completed && 
                process.step_data.build?.quality_check_passed);
    case 'checkout':
      return !!(process.step_data.checkout?.payment_completed);
    default:
      return false;
  }
};

export const getNextStep = (currentStep: BikeSalesStep): BikeSalesStep | null => {
  const stepOrder: BikeSalesStep[] = ['creation', 'build', 'checkout'];
  const currentIndex = stepOrder.indexOf(currentStep);
  return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null;
};

export const canAdvanceToStep = (process: BikeSalesProcess, targetStep: BikeSalesStep): boolean => {
  const stepOrder: BikeSalesStep[] = ['creation', 'build', 'checkout'];
  const currentIndex = stepOrder.indexOf(process.current_step);
  const targetIndex = stepOrder.indexOf(targetStep);
  
  // Can only advance to next step or stay on current step
  if (targetIndex > currentIndex + 1) return false;
  
  // Must complete current step to advance
  if (targetIndex > currentIndex && !isStepComplete(process, process.current_step)) {
    return false;
  }
  
  return true;
};
