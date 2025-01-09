import {useLocation} from 'react-router-dom';
import {useState, useEffect} from 'react';
import {Repair, useRepairs} from '../RepairItem/RepairItem';
import {Part, useParts} from '../PartItem/PartItem';
import Notes from './Notes';
import {IRow} from '../../features/TransactionsTable/TransactionsTable';

const TransactionDetail = () => {
    const {repairs, loading: repairsLoading } = useRepairs();
    const {parts, loading: partsLoading} = useParts();

    const location = useLocation();
    const transaction = location.state?.transaction;

    const [repairSearchQuery, setRepairSearchQuery] = useState('');
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [filteredRepairs, setFilteredRepairs] = useState<Repair[]>([]);
    const [filteredParts, setFilteredParts] = useState<Part[]>([]);

    const [doneRepairs, setDoneRepairs] = useState<Record<string, boolean>>({});

    const [currentTransaction, setCurrentTransaction] = useState({
        ...transaction,
        Repairs: transaction?.Repairs || [],
        Parts: transaction?.Parts || [],
        Notes: transaction?.Notes || "",
    });

    const handleSaveNotes = (newNotes: string) => {
        setCurrentTransaction((prevTransaction: IRow) => ({
            ...prevTransaction,
            Notes: newNotes,
        }));
    };

    useEffect(() => {
        if(repairSearchQuery.trim() !== '') {
            const matches = repairs.filter(
                (repair) => 
                    repair.name.toLowerCase().includes(repairSearchQuery.toLowerCase()) &&
                !currentTransaction.Repairs.some((r: Repair) => r._id === repair._id)
            );
            setFilteredRepairs(matches);
        } else {
            setFilteredRepairs([]);
        }
    }, [repairSearchQuery, repairs, currentTransaction.Repairs]);

    useEffect(() => {
        if(partSearchQuery.trim() !== '') {
            const matches = parts.filter(
                (part) => 
                    part.name && part.name.toLowerCase().includes(partSearchQuery.toLowerCase()) &&
                !currentTransaction.Parts.some((p: Part) => p._id === part._id)
            );
            setFilteredParts(matches);
        } else {
            setFilteredParts([]);
        }
    }, [partSearchQuery, parts, currentTransaction.Parts]);
    
    if(repairsLoading || partsLoading) {
        return <p>Loading data...</p>;
    }

    if (!transaction) {
        return <p>No transaction selected!</p>
    }

    const handleSearchChangeR = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRepairSearchQuery(e.target.value);
    };

    const handleSearchChangeP = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPartSearchQuery(e.target.value);
    }

    const handleAddRepair = (repair: Repair) => {
        console.log("handle add repair");
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

    const handleRemoveRepair = (repair: Repair) => {
        const updatedRepairs = currentTransaction.Repairs.filter((r: Repair) => r._id !== repair._id);
        const updatedTotalCost = currentTransaction.Transaction.total_cost - repair.price;

        setCurrentTransaction({
            ...currentTransaction,
            Repairs: updatedRepairs,
            Transaction: {
                ...currentTransaction.Transaction,
                total_cost: updatedTotalCost,
            },
        });
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

    const handleRemovePart = (part: Part) => {
        const updatedParts = currentTransaction.Parts.filter((p: Part) => p._id !== part._id);
        console.log("updated parts: ", updatedParts);
        const updatedTotalCost = currentTransaction.Transaction.total_cost - part.standard_price;

        setCurrentTransaction({
            ...currentTransaction,
            Parts: updatedParts,
            Transaction: {
                ...currentTransaction.Transaction,
                total_cost: updatedTotalCost,
            },
        });
    };

    const toggleDoneRepair = (repairId: string) => {
        setDoneRepairs((prevState) => ({
            ...prevState,
            [repairId]: !prevState[repairId],
        }));
    };

    return (
        <div style={{padding: '20px'}}>
            <h2>Transaction Details</h2>
            <h3>Bike Information</h3>
            <p><strong>Make: </strong>{currentTransaction.Bike.make}</p>
            <p><strong>Model: </strong>{currentTransaction.Bike.model}</p>
            <p><strong>Color: </strong>{currentTransaction.Bike.color}</p>

            <h3>Customer Information</h3>
            <p><strong>Name: </strong>{currentTransaction.Customer.firstName} {transaction.Customer.lastName}</p>
            <p><strong>Email: </strong>{currentTransaction.Customer.email}</p>
            <p><strong>Phone: </strong>{currentTransaction.Customer.phone}</p>

            <Notes notes={currentTransaction.Notes} onSave={handleSaveNotes} />

            <h3>Repairs</h3>
            <ul>
                {currentTransaction.Repairs.map((repair: Repair) => (
                    <li key={repair._id}>
                        {repair.name} - ${repair.price.toFixed(2)}
                        <button
                            onClick={() => toggleDoneRepair(repair._id)}
                            style={{
                                border: '2px solid white',
                                marginLeft: '10px',
                                cursor: 'pointer',
                                backgroundColor: doneRepairs[repair._id] ? 'green' : 'initial',
                                color: 'white',
                            }}
                            >
                            {doneRepairs[repair._id] ? 'Done' : 'Mark as Done'}
                        </button>
                        <button 
                            onClick={() => handleRemoveRepair(repair)}
                            style={{
                                marginLeft: '10px', 
                                cursor: 'pointer',
                                border: 'white',
                                backgroundColor: 'red',
                            }}
                            >
                            Delete
                        </button>
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
                {currentTransaction.Parts.map((part: Part) => (
                    <li key={part._id}>
                        {part.name} - ${part.standard_price.toFixed(2)}
                        <button
                            onClick={() => handleRemovePart(part)}
                            style={{
                                marginLeft: '10px', 
                                cursor: 'pointer',
                                border: 'white',
                                backgroundColor: 'red',
                            }}
                        >
                            Delete
                        </button>
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
            <p><strong>${(currentTransaction.Transaction.total_cost * 1.0625).toFixed(2)}</strong></p>
        </div>
    );
};

export default TransactionDetail;

