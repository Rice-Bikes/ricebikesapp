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
            <p><strong>Make: </strong>{transaction.Bike.make}</p>
            <p><strong>Model: </strong>{transaction.Bike.model}</p>
            <p><strong>Color: </strong>{transaction.Bike.color}</p>

            <h3>Customer Information</h3>
            <p><strong>Name: </strong>{transaction.Customer.firstName} {transaction.Customer.lastName}</p>
            <p><strong>Email: </strong>{transaction.Customer.email}</p>
            <p><strong>Phone: </strong>{transaction.Customer.phone}</p>

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

