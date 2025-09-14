// Types for the new bike transaction system

export interface BikeTransactionStep {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  component?: string; // Reference to the component to render for this step
}

export interface BikeSaleTransaction {
  steps: BikeTransactionStep[];
  currentStepIndex: number;
  isCompleted: boolean;
}

export interface BikeReservation {
  customer_id: string;
  bike_id: string;
  deposit_amount: number;
  reservation_date: string;
  expiry_date?: string;
}

export interface EnhancedBike {
  bike_id: string;
  make: string;
  model: string;
  description: string;
  bike_type: string;
  size_cm: number;
  condition: 'New' | 'Refurbished' | 'Used';
  price: number;
  is_available: boolean;
  reservation_customer_id?: string;
  deposit_amount?: number;
  date_created?: string;
}

// Default steps for bike sale transactions
export const DEFAULT_BIKE_SALE_STEPS: BikeTransactionStep[] = [
  {
    id: 'customer-info',
    name: 'Customer Information',
    description: 'Collect customer details and contact information',
    isRequired: true,
    isCompleted: false,
    component: 'CustomerInfoStep'
  },
  {
    id: 'bike-selection',
    name: 'Bike Selection',
    description: 'Select or confirm the bike being sold',
    isRequired: true,
    isCompleted: false,
    component: 'BikeSelectionStep'
  },
  {
    id: 'inspection',
    name: 'Pre-Sale Inspection',
    description: 'Perform safety check and final inspection',
    isRequired: true,
    isCompleted: false,
    component: 'InspectionStep'
  },
  {
    id: 'pricing',
    name: 'Pricing & Payment',
    description: 'Confirm price and process payment',
    isRequired: true,
    isCompleted: false,
    component: 'PricingStep'
  },
  {
    id: 'completion',
    name: 'Sale Completion',
    description: 'Finalize sale and provide documentation',
    isRequired: true,
    isCompleted: false,
    component: 'CompletionStep'
  }
];
