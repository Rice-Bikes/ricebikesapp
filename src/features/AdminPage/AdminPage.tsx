import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@mui/material';
import DBModel from '../../model';
import { ToastContainer, toast } from 'react-toastify';
import { AgGridReact } from 'ag-grid-react';

const AdminPage: React.FC = () => {
    const [fileContent, setFileContent] = useState<string>('');
    const mutation = useMutation(
        {
            mutationFn: (data: string) => {
                console.log("sending file", data);
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

    const handleSubmit = () => {
        mutation.mutate(fileContent);
    };

    return (
        <div>
            <ToastContainer />
            <h1>Admin Page</h1>
            <input type="file" accept=".txt,.csv" onChange={handleFileUpload} />
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
                Upload
            </Button>
            {mutation.isError && <p>Error uploading file</p>}
            {mutation.isSuccess && <p>File uploaded successfully</p>}
            <AgGridReact/>
        </div>
    );
};

export default AdminPage;