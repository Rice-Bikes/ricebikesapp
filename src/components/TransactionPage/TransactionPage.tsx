import {useLocation} from 'react-router-dom';
import {useState} from 'react';
import {Repair} from '../RepairItem/RepairItem';
import {Part} from '../PartItem/PartItem';



const Transaction = () => {
    const location = useLocation();
    const transaction = location.state?.transaction;
    const [repairSearchQuery, setRepairSearchQuery] = useState('');
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
    //const [repairs, setRepairs] = useState<Repair[]>([]);
    const repairs = transaction.Repairs || [];
    const parts = transaction.parts || [];
    const [currentTransaction, setCurrentTransaction] = useState({
        ...transaction,
        Repairs: repairs,
        Parts: parts,
    });
    const [filteredParts, setFilteredParts] = useState<Part[]>([]);
    //const [parts, setParts] = useState<Part[]>([]);
    

    if (!transaction) {
        return <p>No transaction selected!</p>
    }

    const handleSearchChangeR = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setRepairSearchQuery(query);

        if(query.trim() !== '') {
            const matches = repairs.filter((repair: Repair) => repair.name.toLowerCase().includes(query.toLowerCase()) && !currentTransaction.Repairs.some((r:Repair) => r._id === repair._id));
            setFilteredRepairs(matches);
        } else {
            setFilteredRepairs([]);
        }
    };

    const handleSearchChangeP = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setPartSearchQuery(query);

        if(query.trim() !== '') {
            const matches = parts.filter((part: Part) => part.name.toLowerCase().includes(query.toLowerCase()) && !currentTransaction.Parts.some((p:Part) => p._id === part._id));
            setFilteredParts(matches);
        }
    }

    const handleAddRepair = (repair: Repair) => {
        const updatedRepairs = [...currentTransaction.Repairs, repair];
        const updatedTotalCost = currentTransaction.Transaction.total_cost + repair.price;

        setCurrentTransaction({
            ...currentTransaction,
            Repairs: updatedRepairs,
            Transaction: {
                ...currentTransaction.Transaction,
                total_cost: updatedTotalCost,
            },
        });

        setRepairSearchQuery('');
        setFilteredRepairs([]);
    };

    const handleAddPart = (part: Part) => {
        const updatedParts = [...currentTransaction.Parts, part];
        const updatedTotalCost = currentTransaction.Transaction.total_cost + part.standard_price;

        setCurrentTransaction({
            ...currentTransaction,
            Parts: updatedParts,
            Transaction: {
                ...currentTransaction.Transaction,
                total_cost: updatedTotalCost,
            },
        });

        setRepairSearchQuery('');
        setFilteredParts([]);
    };

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

            <h3>Repairs</h3>
            <ul>
                {transaction.Repairs.map((repair: Repair) => (
                    <li key={repair._id}>
                        {repair.name} - ${repair.price.toFixed(2)}
                    </li>
                ))}
            </ul>

            <h3>Add Repair</h3>
            <input 
                type="text"
                placeholder="Search for a repair"
                value={repairSearchQuery}
                onChange={handleSearchChangeR}
            />
            <ul>
                {filteredRepairs.map((repair) => (
                    <li key={repair._id} onClick={() => handleAddRepair(repair)} style={{cursor: 'pointer'}}>
                        {repair.name} - ${repair.price.toFixed(2)}
                    </li>
                ))}
            </ul>

            <h3>Parts</h3>
            <ul>
                {transaction.Parts.map((part: Part) => (
                    <li key={part._id}>
                        {part.name} - ${part.standard_price.toFixed(2)}
                    </li>
                ))}
            </ul>

            <h3>Add Part</h3>
            <input 
                type="text"
                placeholder="Search for a part"
                value={partSearchQuery}
                onChange={handleSearchChangeP}
            />
            <ul>
                {filteredParts.map((part) => (
                    <li key={part._id} onClick={() => handleAddPart(part)} style={{cursor: 'pointer'}}>
                        {part.name} - ${part.standard_price.toFixed(2)}
                    </li>
                ))}
            </ul>

            <h3>Total</h3>
            <p><strong>${transaction.Transaction.total_cost.toFixed(2)}</strong></p>
        </div>
    );
};

export default Transaction;

