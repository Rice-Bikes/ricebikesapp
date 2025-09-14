import React from 'react';
import { BikeTransactionPage } from './BikeTransactionPage';

/**
 * Wrapper component for BikeTransactionPage
 * The BikeSalesProcessProvider is now handled directly in BikeTransactionPage
 * so this wrapper just renders the page component
 */
export const BikeTransactionPageWrapper: React.FC = () => {
    return <BikeTransactionPage />;
};
