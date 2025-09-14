import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Card, CardContent } from '@mui/material';
import { useSlackNotifications } from '../hooks/useSlackNotifications';

/**
 * Quick test component for debugging notification issues
 * Add this temporarily to any page to test notifications
 */
const QuickNotificationTest: React.FC = () => {
    const [testMessage, setTestMessage] = useState('Test notification from Rice Bikes App!');
    const [result, setResult] = useState<string | null>(null);
    const { sendNotification, notifyBuildReady, loading, error } = useSlackNotifications();

    const handleTestNotification = async () => {
        try {
            setResult(null);
            await sendNotification(testMessage, 'manual');
            setResult('✅ Notification sent successfully!');
        } catch (err) {
            setResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleTestBuildReady = async () => {
        try {
            setResult(null);
            const success = await notifyBuildReady('TEST-BIKE-001', 'TEST-TRANS-123', 'Test Mechanic', 'Trek Test Bike');
            setResult(success ? '✅ Build ready notification sent!' : '⚠️ Notification failed (check console)');
        } catch (err) {
            setResult(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <Card sx={{ maxWidth: 500, m: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    🔔 Quick Notification Test
                </Typography>

                <TextField
                    fullWidth
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    label="Test Message"
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleTestNotification}
                        disabled={loading}
                        size="small"
                    >
                        Send Custom
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleTestBuildReady}
                        disabled={loading}
                        size="small"
                    >
                        Test Build Ready
                    </Button>
                </Box>

                {result && (
                    <Alert severity={result.includes('✅') ? 'success' : 'error'} sx={{ mb: 2 }}>
                        {result}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error">
                        Hook Error: {error}
                    </Alert>
                )}

                <Typography variant="caption" color="text.secondary">
                    Check browser console for detailed logs. Backend: {import.meta.env.VITE_API_URL}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default QuickNotificationTest;
