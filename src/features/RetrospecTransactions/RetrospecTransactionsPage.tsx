import React, { useState, KeyboardEvent } from 'react';
import { Checkbox, TextField, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface Step {
    id: number;
    description: string;
    completed: boolean;
}

const RetrospecTransactionsPage: React.FC = () => {
    const [steps, setSteps] = useState<Step[]>([
        { id: 1, description: 'Assemble Frame', completed: false },
        { id: 2, description: 'Install Wheels', completed: false },
        { id: 3, description: 'Attach Handlebars', completed: false },
        { id: 4, description: 'Install Brakes', completed: false },
        { id: 5, description: 'Add Seat', completed: false },
    ]);

    const [sellingPoints, setSellingPoints] = useState<string[]>([
        'Lightweight frame',
        'Durable tires',
        'Comfortable seat',
    ]);

    const toggleStepCompletion = (id: number) => {
        setSteps(steps.map(step => step.id === id ? { ...step, completed: !step.completed } : step));
    };

    const addSellingPoint = (point: string) => {
        setSellingPoints([...sellingPoints, point]);
    };

    const removeSellingPoint = (index: number) => {
        setSellingPoints(sellingPoints.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value) {
            addSellingPoint(e.currentTarget.value);
            e.currentTarget.value = '';
        }
    };

    return (
        <div>
            <Typography variant="h4">Build a Bike</Typography>
            <List>
                {steps.map(step => (
                    <ListItem key={step.id}>
                        <Checkbox
                            checked={step.completed}
                            onChange={() => toggleStepCompletion(step.id)}
                        />
                        <ListItemText primary={step.description} />
                    </ListItem>
                ))}
            </List>
            <Typography variant="h5">Selling Points</Typography>
            <List>
                {sellingPoints.map((point, index) => (
                    <ListItem key={index}>
                        <ListItemText
                            primary={point}
                            secondary={
                                <IconButton edge="end" onClick={() => removeSellingPoint(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            } />

                    </ListItem>
                ))}
            </List>
            <TextField
                label="Add a selling point"
                variant="outlined"
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

export default RetrospecTransactionsPage;