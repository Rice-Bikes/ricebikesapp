import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, TextField, Alert, Card, CardContent, Checkbox, LinearProgress, Divider, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useUserQuery';
import { Build, CheckCircle, RadioButtonUnchecked, Person } from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DBModel from '../../model';
import Notes from '../TransactionPage/Notes';
import { CustomerReservation } from '../CustomerReservation';
import { useSlackNotifications } from '../../hooks/useSlackNotifications';

// Build task definitions (moved outside component to avoid dependency issues)
const BUILD_TASKS = [
    { id: 'front_wheel', label: 'Install front wheel with correct tire tread direction, tighten with 15mm wrench', repair_id: '00000000-671a-bba2-3810-420b4cca4cd3' },
    { id: 'pedals', label: 'Install pedals (L/R marked, left is reverse threaded), apply grease, tighten to ~10nm', repair_id: '00000000-5a8c-cd91-4459-8272c1ec05a4' },
    { id: 'chain_tension', label: 'Tension chain using dropout bolts (0.25" up/down motion, slightly loose better)', repair_id: '00000000-6349-c2c0-da5c-a7275bb9932f' },
    { id: 'stem', label: 'Apply fiber grip, install stem to max height mark, ensure cable routing, tighten to 22nm', repair_id: '00000000-5a8c-cd91-4459-8272c1ec0597' },
    { id: 'headset', label: 'Adjust headset (loosen both nuts, hand-tighten bottom until no play, lock top nut)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec058d' },
    { id: 'hubs', label: 'Check hubs for play (should have none)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec05b5' },
    { id: 'handlebars', label: 'Rotate bars to rise up and sweep back, tighten to 14nm', repair_id: '00000000-5a8c-cd91-4459-8272c1ec0592' },
    { id: 'brake_levers', label: 'Position brake levers against grips, tighten moderately (should rotate in crash)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec0589' },
    { id: 'true_wheels', label: 'True wheels (no sudden wobbles, can be done with wheels on bike)', repair_id: '00000000-6025-9c41-654c-0a0dbd6d3847' },
    { id: 'brake_calipers', label: 'Center calipers, apply triflow to pivots, use threadlocker on pads (4nm)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec058b' },
    { id: 'brake_adjustment', label: 'Adjust brake cable tension (lock wheel with less than half lever travel)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec0588' },
    { id: 'seatpost_saddle', label: 'Grease and install seatpost, clamp down on seat tube, ensure bolts snug, level saddle with ground (6-8nm)', repair_id: '00000000-5bbd-448f-9093-87ce5113d172' },
    { id: 'tire_pressure', label: 'Inflate tires to slightly under max pressure (if max 90, use 70-80)', repair_id: '00000000-671a-bad6-3810-420b4cca4c8f' },
    { id: 'reflectors', label: 'Tighten reflectors straight and out of way for easy seat adjustment', repair_id: '00000000-5a8c-cd91-4459-8272c1ec05b9' },
    { id: 'shifting', label: 'Dial in shifting with index adjustments (geared bikes only)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec0598' },
    { id: 'fenders_rack', label: 'Ensure fenders solid (no rubbing), rack secured, chain guard solid (geared bikes)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec05a3' },
    { id: 'bottom_bracket', label: 'Check bottom bracket tightness (non-drive side nut is reverse threaded)', repair_id: '00000000-5a8c-cd91-4459-8272c1ec0594' },
    { id: 'test_ride', label: 'TEST RIDE THE BIKE - must perform like brand new', repair_id: '00000000-5bbd-407f-9093-87ce5113d16e' },
    { id: 'final_cleanup', label: 'Add owner\'s manual to desk stack, discard silver tool, no price tag', repair_id: '00000000-5a8c-cd91-4459-8272c1ec059e' }
];

interface BuildStepProps {
    onStepComplete: () => void;
}

export const BuildStep: React.FC<BuildStepProps> = ({ onStepComplete }) => {
    const { transaction_id } = useParams<{ transaction_id: string }>();
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const { notifyBuildReady, notifyInspectionComplete } = useSlackNotifications();

    // Fetch transaction details to load existing build tasks
    const { data: transactionDetails } = useQuery({
        queryKey: ['transactionDetails', transaction_id, 'repair'],
        queryFn: () => transaction_id ? DBModel.fetchTransactionDetails(transaction_id, 'repair') : Promise.resolve([]),
        enabled: !!transaction_id,
    });

    // Fetch transaction data for Notes component
    const { data: transaction } = useQuery({
        queryKey: ['transaction', transaction_id],
        queryFn: () => transaction_id ? DBModel.fetchTransaction(transaction_id) : Promise.resolve(null),
        enabled: !!transaction_id,
    });

    // Build task checklist state
    const [buildTasks, setBuildTasks] = useState(
        BUILD_TASKS.map(task => ({ ...task, completed: false }))
    );

    const [notes, setNotes] = useState('');
    const [assignedMechanic, setAssignedMechanic] = useState('');
    const [hasBuildStarted, setHasBuildStarted] = useState(false);

    // Initialize assigned mechanic with current user
    useEffect(() => {
        if (currentUser && !assignedMechanic) {
            setAssignedMechanic(`${currentUser.firstname} ${currentUser.lastname}`);
        }
    }, [currentUser, assignedMechanic]);

    // Check if build has already started (either tasks completed OR is_refurb flag is true)
    useEffect(() => {
        const anyTaskCompleted = buildTasks.some(task => task.completed);
        const buildMarkedAsStarted = transaction?.is_refurb === true;
        setHasBuildStarted(anyTaskCompleted || buildMarkedAsStarted);
    }, [buildTasks, transaction?.is_refurb]);

    // Pre-create build task entries and load existing data
    useEffect(() => {
        const initializeBuildTasks = async () => {
            if (!transaction_id || !currentUser?.user_id) return;

            const buildTaskRepairIds = BUILD_TASKS.map(task => task.repair_id);

            if (transactionDetails && transactionDetails.length > 0) {
                // Filter build tasks from transaction details using the actual repair_ids
                const buildTaskDetails = transactionDetails.filter((detail) =>
                    detail.repair_id && buildTaskRepairIds.includes(detail.repair_id)
                );

                // Update task completion states
                setBuildTasks(prevTasks =>
                    prevTasks.map(task => {
                        const existingDetail = buildTaskDetails.find((detail) =>
                            detail.repair_id === task.repair_id
                        );
                        return {
                            ...task,
                            completed: existingDetail ? existingDetail.completed || false : false
                        };
                    })
                );

                // Create missing task entries
                const missingTasks = BUILD_TASKS.filter(task =>
                    !buildTaskDetails.some(detail => detail.repair_id === task.repair_id)
                );

                console.log('Missing tasks that need to be created:', missingTasks.map(t => ({ id: t.id, repair_id: t.repair_id })));

                if (missingTasks.length > 0) {
                    try {
                        // Pre-create all missing task entries as uncompleted
                        await Promise.all(
                            missingTasks.map(task =>
                                DBModel.postTransactionDetails(
                                    transaction_id,
                                    task.repair_id,
                                    currentUser.user_id,
                                    1,
                                    "repair"
                                )
                            )
                        );

                        console.log('Successfully created missing tasks');

                        // Invalidate cache to refetch updated data
                        queryClient.invalidateQueries({
                            queryKey: ['transactionDetails', transaction_id, 'repair']
                        });
                    } catch (error) {
                        console.error('Error pre-creating build tasks:', error);
                    }
                }
            } else if (currentUser?.user_id) {
                // No existing details, create all tasks
                try {
                    await Promise.all(
                        BUILD_TASKS.map(task =>
                            DBModel.postTransactionDetails(
                                transaction_id,
                                task.repair_id,
                                currentUser.user_id,
                                1,
                                "repair"
                            )
                        )
                    );

                    // Invalidate cache to refetch newly created data
                    queryClient.invalidateQueries({
                        queryKey: ['transactionDetails', transaction_id, 'repair']
                    });
                } catch (error) {
                    console.error('Error creating build tasks:', error);
                }
            }
        };

        initializeBuildTasks();

        // Load notes from transaction
        if (transaction && transaction.description) {
            setNotes(transaction.description);
        }
    }, [transactionDetails, transaction, transaction_id, currentUser?.user_id, queryClient]);

    const handleTaskToggle = async (taskId: string) => {
        if (!transaction_id || !currentUser?.user_id) return;

        const task = buildTasks.find(t => t.id === taskId);
        if (!task) return;

        console.log('Toggling task:', { taskId, repair_id: task.repair_id, current_completed: task.completed });

        const newCompletedState = !task.completed;

        // Update local state immediately for responsive UI
        setBuildTasks(prevTasks =>
            prevTasks.map(t =>
                t.id === taskId ? { ...t, completed: newCompletedState } : t
            )
        );

        try {
            // Find existing transaction detail for this repair (should always exist now)
            const existingDetail = transactionDetails?.find(detail =>
                detail.repair_id === task.repair_id
            );

            console.log('Found existing detail:', existingDetail);

            if (existingDetail && existingDetail.transaction_detail_id) {
                // Update existing entry with the new completion state
                console.log('Updating existing detail:', existingDetail.transaction_detail_id, 'to', newCompletedState);
                await DBModel.updateTransactionDetails(
                    existingDetail.transaction_detail_id,
                    newCompletedState
                );
            } else {
                console.error('No existing transaction detail found for task:', task.id, 'repair_id:', task.repair_id);
                console.log('Available transaction details:', transactionDetails?.map(d => ({ repair_id: d.repair_id, transaction_detail_id: d.transaction_detail_id })));
                // This shouldn't happen with pre-creation, but fallback to create if needed
                console.log('Creating new transaction detail for task:', task.id);
                await DBModel.postTransactionDetails(
                    transaction_id,
                    task.repair_id,
                    currentUser.user_id,
                    1,
                    "repair"
                );
            }

            // Invalidate the query cache to refetch the data
            queryClient.invalidateQueries({ queryKey: ['transactionDetails', transaction_id, 'repair'] });

            // Check if all tasks are now completed and send notification
            const updatedTasks = buildTasks.map(t =>
                t.id === taskId ? { ...t, completed: newCompletedState } : t
            );
            const allTasksCompleted = updatedTasks.every(t => t.completed);
            const wasJustCompleted = newCompletedState && allTasksCompleted;

            if (wasJustCompleted && transaction_id) {
                // Send Slack notification that bike is ready for inspection
                console.log('All build tasks completed! Sending notification...');

                // Get bike information for the notification
                const bike = transaction?.Bike;
                const bikeModel = bike ? `${bike.make || ''} ${bike.model || ''}`.trim() : undefined;
                const mechanic = assignedMechanic || `${currentUser?.firstname || ''} ${currentUser?.lastname || ''}`.trim() || 'Unknown';

                notifyBuildReady(
                    bike?.bike_id || 'Unknown',
                    transaction_id,
                    mechanic,
                    bikeModel
                ).then(success => {
                    if (success) {
                        console.log('Build ready notification sent successfully');
                    } else {
                        console.warn('Build ready notification failed, but build process continues');
                    }
                }).catch(error => {
                    console.warn('Build ready notification error:', error);
                });
            }
        } catch (error) {
            console.error('Error saving build task:', error);
            // Revert the local state if the API call failed
            setBuildTasks(prevTasks =>
                prevTasks.map(t =>
                    t.id === taskId ? { ...t, completed: !newCompletedState } : t
                )
            );
        }
    };

    const handleNotesChange = async (newNotes: string) => {
        setNotes(newNotes);

        // Save notes to transaction description field
        if (transaction_id && transaction) {
            try {
                await DBModel.updateTransaction(transaction_id, {
                    transaction_type: transaction.transaction_type,
                    bike_id: transaction.bike_id,
                    total_cost: typeof transaction.total_cost === 'number'
                        ? transaction.total_cost
                        : parseFloat(transaction.total_cost as string) || 0,
                    description: newNotes, // Update the description with new notes
                    is_completed: transaction.is_completed,
                    is_paid: transaction.is_paid,
                    is_refurb: transaction.is_refurb,
                    is_urgent: transaction.is_urgent,
                    is_nuclear: transaction.is_nuclear,
                    is_beer_bike: transaction.is_beer_bike,
                    is_reserved: transaction.is_reserved,
                    is_waiting_on_email: transaction.is_waiting_on_email,
                    date_completed: transaction.date_completed
                });

                // Invalidate transaction query to refresh data
                queryClient.invalidateQueries({ queryKey: ['transaction', transaction_id] });
            } catch (error) {
                console.error('Error saving notes to transaction:', error);
            }
        }
    };

    const handleStartBuild = async () => {
        if (!transaction_id) return;

        try {
            // Update transaction to indicate build has started (set is_refurb to true)
            if (transaction) {
                await DBModel.updateTransaction(transaction_id, {
                    transaction_type: transaction.transaction_type,
                    bike_id: transaction.bike_id,
                    total_cost: typeof transaction.total_cost === 'number'
                        ? transaction.total_cost
                        : parseFloat(transaction.total_cost as string) || 0,
                    description: transaction.description || '',
                    is_completed: transaction.is_completed,
                    is_paid: transaction.is_paid,
                    is_refurb: true, // Mark as actively being built
                    is_urgent: transaction.is_urgent,
                    is_nuclear: transaction.is_nuclear,
                    is_beer_bike: transaction.is_beer_bike,
                    is_reserved: transaction.is_reserved,
                    is_waiting_on_email: transaction.is_waiting_on_email,
                    date_completed: transaction.date_completed
                });

                // Invalidate transaction query to refresh data
                queryClient.invalidateQueries({ queryKey: ['transaction', transaction_id] });

                setHasBuildStarted(true);
                console.log('Build process started - transaction marked as actively being built');
            }
        } catch (error) {
            console.error('Error starting build process:', error);
        }
    };

    const handleAdvanceStep = async () => {
        if (canAdvance) {
            // Send notification that inspection is complete before advancing
            if (transaction_id) {
                console.log('Build and inspection phase completed! Sending inspection notification...');

                const bike = transaction?.Bike;
                const bikeModel = bike ? `${bike.make || ''} ${bike.model || ''}`.trim() : undefined;
                const mechanic = assignedMechanic || `${currentUser?.firstname || ''} ${currentUser?.lastname || ''}`.trim() || 'Unknown';

                // Send inspection complete notification (non-blocking)
                notifyInspectionComplete(
                    bike?.bike_id || 'Unknown',
                    transaction_id,
                    mechanic,
                    bikeModel,
                    notes || transaction?.description || undefined
                ).then(success => {
                    if (success) {
                        console.log('Inspection complete notification sent successfully');
                    } else {
                        console.warn('Inspection complete notification failed, but workflow continues');
                    }
                }).catch(error => {
                    console.warn('Inspection complete notification error:', error);
                });
            }

            // In the new system, WorkflowSteps only tracks completion
            // Business data would be saved to transaction metadata/notes
            onStepComplete();
        }
    };

    // Calculate progress based on completed tasks
    const completedTasks = buildTasks.filter(task => task.completed).length;
    const totalTasks = buildTasks.length;
    const buildProgress = Math.round((completedTasks / totalTasks) * 100);
    const canAdvance = completedTasks === totalTasks;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
                Build & Inspection Phase
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {!hasBuildStarted
                    ? "Bike has arrived. Click 'Start Build Process' to begin actively building this bike."
                    : "Prepare the bike and complete quality inspection before customer reservation."}
            </Typography>

            {/* Start Build Section */}
            {!hasBuildStarted && (
                <Card sx={{ mb: 3, bgcolor: 'warning.50' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            📦 Bike Arrived - Ready to Start Build
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            The bike has arrived in the shop and is ready to be built. Click the button below to start the build process
                            and move this transaction into the active "Main Transactions" queue.
                        </Typography>
                        <Button
                            variant="contained"
                            color="warning"
                            size="large"
                            onClick={handleStartBuild}
                            startIcon={<Build />}
                            sx={{ px: 4 }}
                        >
                            Start Build Process
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Progress Indicator */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Build Progress</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {completedTasks} of {totalTasks} tasks completed ({buildProgress}%)
                        </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={buildProgress} sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            Assigned to: {assignedMechanic || 'Not assigned'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Task Checklist */}
            <Card sx={{ mb: 3, opacity: hasBuildStarted ? 1 : 0.6 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                            Build & Inspection Tasks
                        </Typography>
                        {!hasBuildStarted && (
                            <Typography variant="body2" color="text.secondary">
                                Start build process to enable tasks
                            </Typography>
                        )}
                    </Box>

                    <List sx={{ py: 0 }}>
                        {buildTasks.map((task, index) => (
                            <ListItem
                                key={task.id}
                                sx={{
                                    px: 0,
                                    cursor: hasBuildStarted ? 'pointer' : 'default',
                                    opacity: hasBuildStarted ? 1 : 0.5
                                }}
                                onClick={hasBuildStarted ? () => handleTaskToggle(task.id) : undefined}
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        checked={task.completed}
                                        onChange={hasBuildStarted ? () => handleTaskToggle(task.id) : undefined}
                                        disabled={!hasBuildStarted}
                                        icon={<RadioButtonUnchecked />}
                                        checkedIcon={<CheckCircle color="success" />}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={task.label}
                                    secondary={`Step ${index + 1} of ${totalTasks}`}
                                    sx={{
                                        textDecoration: task.completed ? 'line-through' : 'none',
                                        opacity: task.completed ? 0.7 : 1
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            {/* Notes Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Build & Inspection Notes
                    </Typography>
                    {currentUser && transaction ? (
                        <Notes
                            notes={transaction.description || ''}
                            onSave={handleNotesChange}
                            user={currentUser}
                            transaction_num={transaction.transaction_num}
                        />
                    ) : (
                        <TextField
                            label="Technical Notes"
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="Document any issues, adjustments, or special notes about the build process..."
                            helperText="These notes will be included with the transaction record"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Customer Reservation Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Customer Reservation (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Reserve this bike for a customer once build quality is satisfactory.
                        This can also be done during the safety check step.
                    </Typography>
                    {transaction_id && (
                        <CustomerReservation
                            transaction_id={transaction_id}
                            transaction={transaction}
                            buttonText="Reserve for Customer"
                            variant="outlined"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Success Message */}
            {canAdvance && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        ✅ All build and inspection tasks completed successfully! Ready to proceed to customer creation.
                    </Typography>
                </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Step 2 of 5: Build & Inspection ({completedTasks} of {totalTasks} tasks completed)
                </Typography>

                <Button
                    variant="contained"
                    onClick={handleAdvanceStep}
                    disabled={!canAdvance}
                    size="large"
                >
                    Proceed to Customer Creation →
                </Button>
            </Box>
        </Box>
    );
};
