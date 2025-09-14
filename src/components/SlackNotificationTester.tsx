import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    Card,
    CardContent,
    CircularProgress,
    Divider
} from '@mui/material';
import { useSlackNotifications } from '../hooks/useSlackNotifications';

/**
 * Development component for testing Slack notification functionality
 * This component provides a UI to test various notification types
 */
const SlackNotificationTester: React.FC = () => {
    const [message, setMessage] = useState('');
    const [testResult, setTestResult] = useState<string | null>(null);
    const [testError, setTestError] = useState<string | null>(null);

    const {
        sendNotification,
        notifyBuildReady,
        notifyInspectionComplete,
        testIntegration,
        loading,
        error
    } = useSlackNotifications();

    const handleSendCustomMessage = async () => {
        if (!message.trim()) return;

        try {
            setTestError(null);
            const result = await sendNotification(message, 'manual');
            setTestResult(`✅ Custom message sent: ${result.message}`);
            setMessage('');
        } catch (err) {
            setTestError(err instanceof Error ? err.message : 'Failed to send message');
        }
    };

    const handleTestBuildReady = async () => {
        try {
            setTestError(null);
            const success = await notifyBuildReady(
                'TEST-001',
                'TRANS-123',
                'Test Mechanic',
                'Trek Mountain Bike'
            );
            setTestResult(success
                ? '✅ Build ready notification sent successfully'
                : '⚠️ Build ready notification failed (see console for details)'
            );
        } catch (err) {
            setTestError(err instanceof Error ? err.message : 'Failed to send build ready notification');
        }
    };

    const handleTestInspectionComplete = async () => {
        try {
            setTestError(null);
            const success = await notifyInspectionComplete(
                'TEST-001',
                'TRANS-123',
                'Test Inspector',
                'Trek Mountain Bike',
                'All systems checked and working properly. Ready for customer pickup.'
            );
            setTestResult(success
                ? '✅ Inspection complete notification sent successfully'
                : '⚠️ Inspection complete notification failed (see console for details)'
            );
        } catch (err) {
            setTestError(err instanceof Error ? err.message : 'Failed to send inspection complete notification');
        }
    };

    const handleTestIntegration = async () => {
        try {
            setTestError(null);
            const result = await testIntegration();
            setTestResult(result.success
                ? `✅ Integration test passed: ${result.message}`
                : `❌ Integration test failed: ${result.message}`
            );
        } catch (err) {
            setTestError(err instanceof Error ? err.message : 'Integration test failed');
        }
    };

    const clearResults = () => {
        setTestResult(null);
        setTestError(null);
    };

    return (
        <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    🔔 Slack Notification Tester
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Use this component to test Slack notification functionality in development.
                </Typography>

                {/* Integration Test */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Integration Test
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleTestIntegration}
                        disabled={loading}
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Test Slack Integration'}
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Custom Message */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Send Custom Message
                    </Typography>
                    <TextField
                        label="Custom Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter a test message to send to Slack..."
                        multiline
                        rows={3}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSendCustomMessage}
                        disabled={loading || !message.trim()}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={20} /> : 'Send Custom Message'}
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Pre-defined Notification Tests */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Test Notification Types
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="info"
                            onClick={handleTestBuildReady}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={20} /> : 'Test "Build Ready" Notification'}
                        </Button>

                        <Button
                            variant="outlined"
                            color="success"
                            onClick={handleTestInspectionComplete}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={20} /> : 'Test "Inspection Complete" Notification'}
                        </Button>
                    </Box>
                </Box>

                {/* Results */}
                {(testResult || testError || error) && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Test Results
                                </Typography>
                                <Button size="small" onClick={clearResults}>
                                    Clear
                                </Button>
                            </Box>

                            {testResult && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    {testResult}
                                </Alert>
                            )}

                            {(testError || error) && (
                                <Alert severity="error">
                                    {testError || error}
                                </Alert>
                            )}
                        </Box>
                    </>
                )}

                {/* Instructions */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Instructions:</strong>
                        <br />
                        1. Make sure the backend server is running with Slack webhook configuration
                        <br />
                        2. Use "Test Slack Integration" to verify the connection
                        <br />
                        3. Try sending custom messages or test the specific notification types
                        <br />
                        4. Check your Slack channel to see if notifications are received
                        <br />
                        5. Check browser console for detailed logs
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SlackNotificationTester;
