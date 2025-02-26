import React, { useState } from 'react';
import { Dialog, Box, Typography, Button, CircularProgress } from '@mui/material';
import { useQuery } from "@tanstack/react-query";
import DBModel, { TransactionLog } from '../model';

// const fetchTransactionLogs = async () => {
//     const { data } = await axios.get('/api/transaction-logs');
//     return data;
// };

interface TransactionsLogModalProps {
    // open: boolean;
    // onClose: () => void;
    transaction_id: number;
}

const TransactionsLogModal = ({
    // open,
    // onClose,
    transaction_id
}: TransactionsLogModalProps

) => {
    const [open, setOpen] = useState(false);
    const { data, error } = useQuery({
        queryKey: ['transactionLogs', transaction_id],
        queryFn: async () => {
            console.log("fetching transaction logs for", transaction_id);
            return DBModel.fetchTransactionLogs(transaction_id);
        },
        select: (data) => {
            console.log("transforming logs", data);
            return data as TransactionLog[]
        },
    });

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <div>
            <Button variant="contained" color="primary" onClick={handleOpen}>
                Open Transactions Log
            </Button>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 24, maxHeight: '80vh', overflowY: 'auto' }}>
                    <Typography variant="h6" component="h2">
                        Transactions Log
                    </Typography>
                    {!data ? (
                        <CircularProgress />
                    ) : error ? (
                        <Typography color="error">Error fetching transaction logs</Typography>
                    ) : (
                        <Box>
                            {data.map((log: TransactionLog, index: number) => (
                                <Box key={index} sx={{ mt: 2 }}>
                                    <Typography variant="body1"> {`${log.Users?.firstname + ' ' + log.Users?.lastname} ${log.change_type} ${log.description} on ${new Date(log.date_modified)}`}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Dialog>
        </div>
    );
};

export default TransactionsLogModal;