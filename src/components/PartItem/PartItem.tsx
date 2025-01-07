import {useEffect, useState} from 'react';
import Papa from 'papaparse'; // Import papaparse

export type Part = { // TODO: what should be optional?
    _id: number;
    name: string;
    description?: string;
    category?: string;
    desired_stock?: number;
    standard_price: number;
    stock: number;
    wholesale_cost: number;
    condition?: string;
    disabled: boolean;
    managed?: boolean;
    minimum_stock?: number;
    brand?: string;
    size?: string;
    upc: number;
    category_1?: string; // TODO usually this is not optional
    category_2?: string;
    category_3?: string;
    features?: string;
    specifications?: string;
    __v?: string;
    in_stock?: number;
    last_updated?: Date;
    threshold_stock?: number;
}

export const PartItemList = () => {
    const [parts, setParts] = useState<Part[]>([]);

    useEffect(() => {
        fetch('../../parts.bson.csv')
            .then((response) => response.text())
            .then((csvData) => {
                Papa.parse(csvData, {
                    complete: (result: Papa.ParseResult<any>) => {
                        const partsData: Part[] = result.data.map((row: any) => ({
                            _id: Number(row._id),
                            name: row.name,
                            description: row.description ? row.description: undefined,
                            category: row.category ? row.category: undefined,
                            desired_stock: row.desired_stock ? Number(row.desired_stock): undefined,
                            standard_price: Number(row.standard_price),
                            stock: Number(row.stock),
                            wholesale_cost: Number(row.wholesale_cost),
                            condition: row.condition ? row.condition: undefined,
                            disabled: row.disabled === 1,
                            managed: row.managed ? row.managed === 1: undefined,
                            minimum_stock: row.minimum_stock ? Number(row.minimum_stock): undefined,
                            brand: row.brand ? row.brand: undefined,
                            size: row.size ? row.size: undefined,
                            upc: Number(row.upc),
                            category_1: row.category_1 ? row.category_1: undefined, // TODO usually this is not optional
                            category_2: row.category_2 ? row.category_2: undefined,
                            category_3: row.category_3 ? row.category_3: undefined,
                            features: row.features ? row.features: undefined,
                            specifications: row.specifications ? row.specifications: undefined,
                            __v: row.__v ? row.__v: undefined,
                            in_stock: row.in_stock ? Number(row.in_stock): undefined,
                            last_updated: row.last_updated ? row.last_updated: undefined,
                            threshold_stock: row.threshold_stock ? Number(row.threshold_stock): undefined,
                        }));
                        setParts(partsData);
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
            <h2>Parts List</h2>
            <ul>
                {parts.map((part) => (
                    <li key={part._id}>
                        {part.name} - ${part.standard_price} ({part.disabled ? 'Disabled' : 'Active'})
                    </li>
                ))}
            </ul>
        </div>
    );
};