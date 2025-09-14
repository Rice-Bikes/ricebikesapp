import { useState, useCallback } from 'react';
import notificationService, { NotificationResponse } from '../services/notificationService';

interface UseSlackNotificationsReturn {
  sendNotification: (message: string, type?: 'manual' | 'auto' | 'build_ready' | 'inspection_ready') => Promise<NotificationResponse>;
  notifyBuildReady: (bikeId: string, transactionId: string, mechanic: string, bikeModel?: string) => Promise<boolean>;
  notifyInspectionComplete: (bikeId: string, transactionId: string, mechanic: string, bikeModel?: string, notes?: string) => Promise<boolean>;
  testIntegration: () => Promise<NotificationResponse>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom React hook for Slack notifications
 * Provides easy-to-use methods for sending notifications with loading states and error handling
 */
export const useSlackNotifications = (): UseSlackNotificationsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = useCallback(async (
    message: string,
    type: 'manual' | 'auto' | 'build_ready' | 'inspection_ready' = 'manual'
  ): Promise<NotificationResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await notificationService.sendSlackNotification(message, type);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const notifyBuildReady = useCallback(async (
    bikeId: string,
    transactionId: string,
    mechanic: string,
    bikeModel?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await notificationService.notifyBuildReadyForInspection(bikeId, transactionId, mechanic, bikeModel);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send build ready notification';
      setError(errorMessage);
      console.warn('Build ready notification failed:', errorMessage);
      // Don't throw - notification failure shouldn't block the workflow
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const notifyInspectionComplete = useCallback(async (
    bikeId: string,
    transactionId: string,
    mechanic: string,
    bikeModel?: string,
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await notificationService.notifyInspectionCompleted(bikeId, transactionId, mechanic, bikeModel, notes);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send inspection complete notification';
      setError(errorMessage);
      console.warn('Inspection complete notification failed:', errorMessage);
      // Don't throw - notification failure shouldn't block the workflow
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const testIntegration = useCallback(async (): Promise<NotificationResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await notificationService.testSlackIntegration();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendNotification,
    notifyBuildReady,
    notifyInspectionComplete,
    testIntegration,
    loading,
    error
  };
};
