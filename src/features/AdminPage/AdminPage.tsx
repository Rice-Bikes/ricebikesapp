import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Grid2 } from '@mui/material';
import DBModel from '../../model';
import { ToastContainer, toast } from 'react-toastify';
// import PdfViewer from '../../components/PdfViewer';
import RepairsPage from '../RepairsPage';
import ItemsTable from '../ItemCataloguePage';

const AdminPage: React.FC = () => {
    const [fileContent, setFileContent] = useState<string>('');
    // const [pdfContent, setPdfContent] = useState<File>();
    const mutation = useMutation(
        {
            mutationFn: (data: string) => {
                return DBModel.refreshItems(data);
            },
            onSuccess: () => {
                toast.success('File uploaded successfully');
            },
            onError: (error: Error) => {
                toast.error(`Error uploading file: ${error.message}`);
            },
        });

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // console.log(file)
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setFileContent(text);
            };
            reader.readAsText(file);
        }
    };

    // const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (file) {
    //         setPdfContent(file);
    //     }
    // };

    const handleSubmit = () => {
        mutation.mutate(fileContent);
    };

    return (
        <div style={{ padding: '0 5vw', paddingBottom: '100px' }}>
            <ToastContainer />
            <h1>Admin Page</h1>
            {/* <TextField
                type="file"
                slotProps={{
                    htmlInput: { accept: '.pdf' }
                }}
                onChange={handlePdfUpload}
            />
            <PdfViewer file={pdfContent} /> */}
            <Grid2 sx={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                <h2>QBP Catalog Refresh</h2>
                <input type="file" accept=".txt,.csv" onChange={handleFileUpload} />
                <Button onClick={handleSubmit} disabled={mutation.isPending} type='submit' variant='outlined'>
                    Upload
                </Button>
                {mutation.isError && <p>Error uploading file</p>}
                {mutation.isSuccess && <p>File uploaded successfully</p>}
            </Grid2>
            <Grid2 container >
                <Grid2 size={6} >
                    <RepairsPage />
                </Grid2>
                <Grid2 size={6} >
                    <ItemsTable />
                </Grid2>
            </Grid2>
        </div>
    );
};

export default AdminPage;