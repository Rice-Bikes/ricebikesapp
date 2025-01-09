import {createContext, useContext, useEffect, useState} from 'react';
import Papa from 'papaparse'; // Import papaparse

export type Repair = { // TODO what is usually optional
    _id: string;
    name: string;
    price: number;
    disabled: boolean; 
    description: string;
    __v?: string;
}

type RepairsContextType = {
    repairs: Repair[];
    loading: boolean;
};

const RepairsContext = createContext<RepairsContextType | undefined>(undefined);

export const RepairsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //console.log('Fetching CSV file...');
        fetch('/repairs.bson.csv')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
                }
                return response.text();
            })
            .then((csvData) => {
                //console.log('CSV Data:', csvData);  // Debug log to ensure CSV is loaded correctly

                Papa.parse(csvData, {
                    complete: (result: Papa.ParseResult<any>) => {
                        //console.log('Parsed Data:', result);  // Debug log for parsed data
                        
                        if (result.errors.length > 0) {
                            console.error('Parsing errors:', result.errors);  // Log parsing errors, if any
                        }

                        const repairsData: Repair[] = result.data.map((row: any) => ({
                            _id: row._id,
                            name: row.name,
                            price: Number(row.price),
                            disabled: row.disabled === 'true',
                            description: row.description,
                            __v: row.__v ? row.__v : undefined,
                        }));

                        //console.log('Mapped Repairs Data:', repairsData);  // Check the mapped data structure

                        setRepairs(repairsData);
                        setLoading(false);
                    },
                    header: true,
                    skipEmptyLines: true,
                });
            })
            .catch((error) => {
                console.error('Error loading or parsing CSV file: ', error);  // More detailed error logging
                setLoading(false);
            });
    }, []);

    return (
        <RepairsContext.Provider value={{repairs, loading}}>
            {children}
        </RepairsContext.Provider>
    );
};

export const useRepairs = () => {
    const context = useContext(RepairsContext);
    if (!context) {
        throw new Error('useReparis must be used within a RepairsProvider');
    }
    return context;
}

