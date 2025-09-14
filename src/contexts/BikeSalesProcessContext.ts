import { createContext } from 'react';
import { Transaction, TransactionDetails } from '../model';

// Extend TransactionDetails for bike steps
export interface BikeStepDetails extends TransactionDetails {
  step_type: 'bike_creation' | 'bike_build' | 'bike_reservation' | 'bike_checkout';
  step_name: string;
  step_data: {
    // Creation step data
    bike_selected?: boolean;
    customer_confirmed?: boolean;
    frame_type?: 'new' | 'refurbished';
    frame_color?: string;
    bike_size?: string;
    components?: string[];
    
    // Build step data
    frame_prepared?: boolean;
    components_installed?: boolean;
    quality_check_passed?: boolean;
    mechanic_notes?: string;
    quality_rating?: 1 | 2 | 3 | 4 | 5;
    
    // Reservation step data
    deposit_amount?: number;
    deposit_paid?: boolean;
    pickup_date?: string;
    customer_notified?: boolean;
    
    // Checkout step data
    final_payment_due?: number;
    final_payment_received?: boolean;
    bike_delivered?: boolean;
    warranty_explained?: boolean;
    transaction_completed?: boolean;
  };
}

export interface BikeSalesProcessContextType {
  steps: BikeStepDetails[];
  transaction: Transaction | null;
  loading: boolean;
  error: string | null;
  
  // Process management
  loadProcess: (transactionId: string) => Promise<void>;
  
  // Step management
  updateStepData: (stepType: BikeStepDetails['step_type'], data: Partial<BikeStepDetails['step_data']>) => Promise<void>;
  markStepComplete: (stepType: BikeStepDetails['step_type']) => Promise<void>;
  
  // Navigation helpers
  canProceedToStep: (stepType: BikeStepDetails['step_type']) => boolean;
  getProgressPercentage: () => number;
  getCurrentStep: () => BikeStepDetails['step_type'];
  getStepByType: (stepType: BikeStepDetails['step_type']) => BikeStepDetails | undefined;
}

export const BikeSalesProcessContext = createContext<BikeSalesProcessContextType | undefined>(undefined);
