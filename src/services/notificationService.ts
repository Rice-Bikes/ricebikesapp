/**
 * Notification Service for Slack Integration
 * Provides methods to send notifications to Slack channels
 */

interface NotificationRequest {
  message: string;
  type?: 'manual' | 'auto' | 'build_ready' | 'inspection_ready';
}

interface NotificationResponse {
  success: boolean;
  message: string;
}

interface NotificationError {
  success: false;
  error: string;
  errors?: Array<{ msg: string; param: string; value: unknown }>;
}

const hostname = import.meta.env.VITE_API_URL;


class NotificationService {
  private baseUrl: string;

  constructor(baseUrl: string = hostname) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a manual Slack notification
   */
  async sendSlackNotification(
    message: string,
    type: 'manual' | 'auto' | 'build_ready' | 'inspection_ready' = 'manual'
  ): Promise<NotificationResponse> {
    try {
      const url = `${this.baseUrl}/notifications/slack-notification`;
      console.log('🔔 Sending Slack notification:', type);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type } as NotificationRequest)
      });

      const result = await response.json() as NotificationResponse | NotificationError;

      if (!response.ok) {
        console.error('❌ Slack notification failed:', response.status, result);
        throw new Error('error' in result ? result.error : 'Failed to send notification');
      }

      console.log('✅ Slack notification sent successfully');
      return result as NotificationResponse;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  /**
   * Notify when a bike build is ready for inspection
   */
  async notifyBuildReadyForInspection(
    bikeId: string,
    transactionId: string,
    mechanic: string,
    bikeModel?: string
  ): Promise<NotificationResponse> {
    const message = this.formatBuildReadyMessage(bikeId, transactionId, mechanic, bikeModel);
    return this.sendSlackNotification(message, 'build_ready');
  }

  /**
   * Notify when a bike inspection is completed
   */
  async notifyInspectionCompleted(
    bikeId: string,
    transactionId: string,
    mechanic: string,
    bikeModel?: string,
    notes?: string
  ): Promise<NotificationResponse> {
    const message = this.formatInspectionCompletedMessage(bikeId, transactionId, mechanic, bikeModel, notes);
    return this.sendSlackNotification(message, 'inspection_ready');
  }

  /**
   * Test Slack integration (development only)
   */
  async testSlackIntegration(): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/slack-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Slack integration test failed:', error);
      throw error;
    }
  }

  /**
   * Format message for build ready notification
   */
  private formatBuildReadyMessage(
    bikeId: string,
    transactionId: string,
    mechanic: string,
    bikeModel?: string
  ): string {
    const bikeInfo = bikeModel ? `${bikeModel} (ID: ${bikeId})` : `Bike ID: ${bikeId}`;
    
    return `🔧 **Bike Build Completed - Ready for Inspection**

📍 **Bike:** ${bikeInfo}
🆔 **Transaction:** #${transactionId}
👨‍🔧 **Built by:** ${mechanic}
⏰ **Completed:** ${new Date().toLocaleString()}

🔍 **Next Step:** Quality inspection required before customer delivery
📋 **Location:** Check build area for completed bike

*Please inspect the bike and verify all build tasks are completed to quality standards.*`;
  }

  /**
   * Format message for inspection completed notification
   */
  private formatInspectionCompletedMessage(
    bikeId: string,
    transactionId: string,
    mechanic: string,
    bikeModel?: string,
    notes?: string
  ): string {
    const bikeInfo = bikeModel ? `${bikeModel} (ID: ${bikeId})` : `Bike ID: ${bikeId}`;
    const notesSection = notes ? `\n📝 **Notes:** ${notes}` : '';
    
    return `✅ **Bike Inspection Completed - Ready for Customer**

📍 **Bike:** ${bikeInfo}
🆔 **Transaction:** #${transactionId}
👨‍🔧 **Inspected by:** ${mechanic}
⏰ **Completed:** ${new Date().toLocaleString()}${notesSection}

🎉 **Status:** Bike is ready for customer pickup/delivery
📋 **Next Step:** Customer notification and scheduling

*Bike has passed all quality checks and is ready for customer handover.*`;
  }

  /**
   * Handle notification errors gracefully
   */
  private async handleNotificationError(error: unknown, context: string): Promise<void> {
    console.error(`Notification error in ${context}:`, error);
    
    // In production, you might want to:
    // 1. Log to an error monitoring service
    // 2. Show a user-friendly message
    // 3. Retry with exponential backoff
    // 4. Fall back to email notifications
    
    // For now, we'll just log the error and continue
    // The workflow should not be blocked by notification failures
  }

  /**
   * Send notification with error handling and retry logic
   */
  async sendNotificationSafely(
    message: string,
    type: 'manual' | 'auto' | 'build_ready' | 'inspection_ready' = 'manual',
    retries: number = 2
  ): Promise<boolean> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.sendSlackNotification(message, type);
        return true;
      } catch (error) {
        console.warn(`Notification attempt ${attempt + 1} failed:`, error);
        
        if (attempt === retries) {
          await this.handleNotificationError(error, 'sendNotificationSafely');
          return false;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return false;
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();

export default notificationService;

// Export types for use in components
export type {
  NotificationRequest,
  NotificationResponse,
  NotificationError
};
