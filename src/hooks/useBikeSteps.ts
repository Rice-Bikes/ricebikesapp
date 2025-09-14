import { useContext } from 'react';
import { BikeStepsContext } from './BikeStepsProvider';

export const useBikeSteps = () => {
  const context = useContext(BikeStepsContext);
  if (context === undefined) {
    throw new Error('useBikeSteps must be used within a BikeStepsProvider');
  }
  return context;
};
