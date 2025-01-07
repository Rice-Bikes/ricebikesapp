import {useEffect, useState} from 'react';
import Papa from 'papaparse'; // Import papaparse

export type Repair = { // TODO what is usually optional
    _id: number;
    name: string;
    price: number;
    disabled: boolean; 
    description: string;
    __v?: string;
}

export const RepairItemList = () => {
    const [repairs, setRepairs] = useState<Repair[]>([]);

    useEffect(() => {
        fetch('../../repairs.bson.csv')
            .then((response) => response.text())
            .then((csvData) => {
                Papa.parse(csvData, {
                    complete: (result: Papa.ParseResult<any>) => {
                        const repairsData: Repair[] = result.data.map((row: any) => ({
                            _id: Number(row._id),
                            name: row.name,
                            price: Number(row.price),
                            disabled: row.disabled === 'true',
                            description: row.description,
                            __v: row.__v ? row.__v : undefined,
                        }));
                        setRepairs(repairsData);
                    },
                    header: true,
                    skipEmptyLines: true,
                });
            })
            .catch((error) => {
                console.error('Error loading or parsing CSV file: ', error);
            });

    }, []);
    return (
        <div>
            <h2>Repairs List</h2>
            <ul>
                {repairs.map((repair) => (
                    <li key={repair._id}>
                        {repair.name} - ${repair.price} ({repair.disabled ? 'Disabled' : 'Active'})
                    </li>
                ))}
            </ul>
        </div>
    );
};

