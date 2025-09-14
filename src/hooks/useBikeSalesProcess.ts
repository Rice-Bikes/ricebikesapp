import { useContext } from 'react';
import { BikeSalesProcessContext } from '../contexts/BikeSalesProcessContext';

export const useBikeSalesProcess = () => {
  const context = useContext(BikeSalesProcessContext);
  if (!context) {
    throw new Error('useBikeSalesProcess must be used within a BikeSalesProcessProvider');
  }
  return context;
};
