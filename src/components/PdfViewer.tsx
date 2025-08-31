import React, { useState } from 'react';
import { Paper, Box, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMutation } from '@tanstack/react-query';
import DBModel from '../model';
import type { ExtractedRow } from '../model';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: theme.spacing(2),
    minHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
}));

interface PdfViewerProps {
    file?: File;
    onDataExtracted?: (data: ExtractedRow[]) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, onDataExtracted }) => {
    const [extractedData, setExtractedData] = useState<ExtractedRow[]>([]);

    const processPdfMutation = useMutation({
        mutationFn: async (pdfFile: File) => {
            const formData = new FormData();
            formData.append('pdf', pdfFile);
            const response = await DBModel.processPdf(formData);
            return Array.isArray(response) ? response : [];
        },
        onSuccess: (data: ExtractedRow[]) => {
            setExtractedData(data);
            onDataExtracted?.(data);
        },
        onError: (error) => {
            console.error('Error processing PDF:', error);
            setExtractedData([]);
        }
    });

    React.useEffect(() => {
        if (file) {
            processPdfMutation.mutate(file);
        }
    }, [file]);

    const rows = Array.isArray(extractedData) ? extractedData : [];
    // console.log("rows", extractedData);

    return (
        <StyledPaper elevation={3}>
            <Typography variant="h6" gutterBottom>
                PDF Content
            </Typography>

            {processPdfMutation.isPending ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 440 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Line</TableCell>
                                <TableCell>Qty</TableCell>
                                <TableCell>Ordered</TableCell>
                                <TableCell>Part Number</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Discount</TableCell>
                                <TableCell>Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.lineNumber}</TableCell>
                                    <TableCell>{row.quantity}</TableCell>
                                    <TableCell>{row.ordered}</TableCell>
                                    <TableCell>{row.partNumber}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.unit}</TableCell>
                                    <TableCell>{row.price}</TableCell>
                                    <TableCell>{row.discount}</TableCell>
                                    <TableCell>{row.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </StyledPaper>
    );
};

export default PdfViewer; 