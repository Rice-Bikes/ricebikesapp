# Frontend Integration Guide - Slack Notifications

This guide shows how to interact with the Slack notification system from your frontend application.

## API Endpoints

The backend exposes notification endpoints at `/notifications` (running on port 3000 by default):

### 1. Send Manual Slack Notification

**Endpoint:** `POST /notifications/slack-notification`

**Request Body:**
```json
{
  "message": "Your notification message here",
  "type": "manual" // optional, defaults to "manual"
}
```

**Frontend Example (JavaScript/TypeScript):**

```javascript
// Send a manual notification
const sendSlackNotification = async (message, type = 'manual') => {
  try {
    const response = await fetch('http://localhost:3000/notifications/slack-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        type: type
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Notification sent successfully:', result);
      return { success: true, data: result };
    } else {
      console.error('Failed to send notification:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: error.message };
  }
};

// Usage examples:
sendSlackNotification("🚴 New bike reservation completed!");
sendSlackNotification("⚠️ System maintenance scheduled for tonight", "manual");
```

### 2. Test Slack Integration (Development Only)

**Endpoint:** `POST /notifications/slack-test`

```javascript
// Test the Slack integration (dev environment only)
const testSlackIntegration = async () => {
  try {
    const response = await fetch('http://localhost:3000/notifications/slack-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    console.log('Test result:', result);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error: error.message };
  }
};
```

## React Integration

### Custom Hook Example

Create a custom React hook for easy integration:

```javascript
import { useState, useCallback } from 'react';

export const useSlackNotifications = (baseUrl = 'http://localhost:3000') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendNotification = useCallback(async (message, type = 'manual') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/notifications/slack-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const testIntegration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/notifications/slack-test`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return {
    sendNotification,
    testIntegration,
    loading,
    error
  };
};
```

### React Component Example

```jsx
import React, { useState } from 'react';
import { useSlackNotifications } from './hooks/useSlackNotifications';

const NotificationPanel = () => {
  const [message, setMessage] = useState('');
  const { sendNotification, testIntegration, loading, error } = useSlackNotifications();

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendNotification(message);
      setMessage('');
      alert('Notification sent successfully!');
    } catch (err) {
      alert(`Failed to send notification: ${err.message}`);
    }
  };

  const handleTest = async () => {
    try {
      const result = await testIntegration();
      alert(`Test ${result.success ? 'passed' : 'failed'}`);
    } catch (err) {
      alert(`Test failed: ${err.message}`);
    }
  };

  return (
    <div className="notification-panel">
      <h3>Slack Notifications</h3>
      
      <form onSubmit={handleSendNotification}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message..."
          maxLength={4000}
          rows={4}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        
        <div>
          <button 
            type="submit" 
            disabled={loading || !message.trim()}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
          
          <button 
            type="button" 
            onClick={handleTest} 
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Test Integration
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
```

## Integration with Existing Workflows

You can trigger notifications when specific actions occur in your frontend:

```javascript
// When a bike is reserved
const handleBikeReservation = async (bikeId, customerId) => {
  try {
    // Your existing reservation logic
    const reservation = await reserveBike(bikeId, customerId);
    
    // Send notification
    await sendSlackNotification(
      `🚴 Bike ${bikeId} has been reserved by customer ${customerId}!`
    );
    
    return reservation;
  } catch (error) {
    console.error('Reservation failed:', error);
  }
};

// When an order is completed
const handleOrderCompletion = async (orderId) => {
  try {
    const order = await completeOrder(orderId);
    
    await sendSlackNotification(
      `✅ Order #${orderId} has been completed successfully!`
    );
    
    return order;
  } catch (error) {
    console.error('Order completion failed:', error);
  }
};

// When a workflow step is completed
const handleWorkflowStepCompletion = async (stepId, transactionId) => {
  try {
    const result = await completeWorkflowStep(stepId, transactionId);
    
    await sendSlackNotification(
      `📋 Workflow step completed for transaction #${transactionId}`
    );
    
    return result;
  } catch (error) {
    console.error('Workflow step completion failed:', error);
  }
};
```

## Error Handling & Rate Limiting

The API includes rate limiting (50 requests per 15 minutes per IP) and input validation. Handle these properly:

```javascript
const handleApiResponse = async (response) => {
  if (response.status === 429) {
    throw new Error('Too many requests. Please wait before sending more notifications.');
  }
  
  if (response.status === 400) {
    const errorData = await response.json();
    const errorMessages = errorData.errors?.map(err => err.msg).join(', ') || 'Invalid input';
    throw new Error(`Validation error: ${errorMessages}`);
  }
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Unknown error occurred');
  }
  
  return response.json();
};

// Enhanced fetch function with proper error handling
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return await handleApiResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Usage
const sendNotificationWithErrorHandling = async (message) => {
  try {
    const result = await fetchWithErrorHandling('/notifications/slack-notification', {
      method: 'POST',
      body: JSON.stringify({ message, type: 'manual' }),
    });
    
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('Too many requests')) {
      // Show user-friendly rate limit message
      alert('You are sending notifications too quickly. Please wait a moment and try again.');
    } else if (error.message.includes('Validation error')) {
      // Show validation errors
      alert(`Please check your input: ${error.message}`);
    } else {
      // Generic error handling
      alert(`Failed to send notification: ${error.message}`);
    }
    throw error;
  }
};
```

## TypeScript Types

Define TypeScript types for better type safety:

```typescript
// Types for notification API
interface NotificationRequest {
  message: string;
  type?: 'manual' | 'auto';
}

interface NotificationResponse {
  success: boolean;
  message: string;
}

interface NotificationError {
  success: false;
  error: string;
  errors?: Array<{ msg: string; param: string; value: any }>;
}

interface SlackTestResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Enhanced hook with TypeScript
export const useSlackNotifications = (baseUrl: string = 'http://localhost:3000') => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = useCallback(async (
    message: string, 
    type: 'manual' | 'auto' = 'manual'
  ): Promise<NotificationResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/notifications/slack-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type } as NotificationRequest)
      });

      const result = await response.json() as NotificationResponse | NotificationError;

      if (!response.ok) {
        throw new Error('error' in result ? result.error : 'Failed to send notification');
      }

      return result as NotificationResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const testIntegration = useCallback(async (): Promise<SlackTestResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/notifications/slack-test`, {
        method: 'POST'
      });

      const result = await response.json() as SlackTestResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return {
    sendNotification,
    testIntegration,
    loading,
    error
  };
};
```

## Configuration

### Environment Variables

Configure your frontend to use the correct backend URL:

```javascript
// config.js
const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  notificationEndpoint: '/notifications',
};

export default config;

// Usage in components
import config from './config';

const { sendNotification } = useSlackNotifications(config.apiBaseUrl);
```

### Production Considerations

For production deployments, ensure:

1. **HTTPS**: Use HTTPS URLs for production
2. **CORS**: Backend CORS is configured for your frontend domain
3. **Authentication**: Consider adding authentication to notification endpoints
4. **Rate Limiting**: Monitor rate limits and implement client-side throttling
5. **Error Monitoring**: Implement proper error logging and monitoring

```javascript
// Production-ready configuration
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.ricebikes.com';
  }
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
};

const config = {
  apiBaseUrl: getApiBaseUrl(),
  notificationEndpoint: '/notifications',
  maxRetries: 3,
  retryDelay: 1000,
};
```

## Key Points

- **Rate Limiting**: Limited to 50 requests per 15 minutes per IP
- **Message Length**: Maximum 4000 characters
- **Development Only**: Test endpoint only works in non-production environments
- **Authentication**: Currently no authentication required (consider adding for production)
- **Error Handling**: Proper error responses with validation details
- **Automatic Notifications**: Server-side notifications happen automatically for bike reservations, workflow completions, and transaction updates

## Automatic Notifications

The following notifications are sent automatically by the backend when actions occur through existing API endpoints:

1. **Bike Reservations**: When bikes are reserved via `/bikes/{id}/reserve`
2. **Workflow Step Completion**: When workflow steps are completed via workflow APIs
3. **Transaction Updates**: When transactions change state (reserved, completed)
4. **Build Completion**: When bike builds are marked as complete

No additional frontend code is needed for these automatic notifications - they trigger server-side when the respective API endpoints are called.
