import React from 'react';
import {useLocation} from 'react-router-dom';

const Transaction = () => {
    const location = useLocation();
    const transaction = location.state?.transaction;
    if (!transaction) {
        return <p>No transaction selected!</p>
    }
    return (
        <div style={{padding: '20px'}}>
            <h2>Transaction Details</h2>
            <h3>Bike Information</h3>
            <p><strong>Make:</strong>{transaction.Make}</p>
            <p><strong>Model:</strong>{transaction.Model}</p>
            <p><strong>Color:</strong>{transaction.Color}</p>

            <h3>Customer Information</h3>
            <p><strong>Name:</strong>{transaction.Name}</p>
            {/**<p><strong>Email:</strong>{transaction.customer.email}</p>
            <p><strong>Phone:</strong>{transaction.customer.phone}</p>**/}

            {/**<h3>Repair</h3>
            <ul>
                {transaction.repairs.map((repair:string, index:number) => (
                    <li key={index}>{repair}</li>
                ))}
            </ul>

            <h3>Parts</h3>
            <ul>
                {transaction.parts.map((part:string, index:number) => (
                    <li key={index}>{part}</li>
                ))}
            </ul>

            <h3>Total</h3>
            <p><strong>${transaction.totalPrice.toFixed(2)}</strong></p>**/}
        </div>
    );
};

export default Transaction;

