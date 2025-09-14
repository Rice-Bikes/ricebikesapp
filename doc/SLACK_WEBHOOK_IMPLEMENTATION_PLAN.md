# Slack Webhook Integration Implementation Plan

## Overview

This document provides a comprehensive plan for implementing Slack webhook notifications in the Rice Bikes backend system. The goal is to send automated notifications when bike transactions progress through different workflow stages.

## Table of Contents

1. [Requirements & Setup](#requirements--setup)
2. [Backend Implementation](#backend-implementation)
3. [Database Schema Changes](#database-schema-changes)
4. [API Endpoints](#api-endpoints)
5. [Integration Points](#integration-points)
6. [Configuration](#configuration)
7. [Testing Strategy](#testing-strategy)
8. [Security Considerations](#security-considerations)
9. [Error Handling & Monitoring](#error-handling--monitoring)
10. [Deployment Steps](#deployment-steps)

---

## Requirements & Setup

### Prerequisites

- Slack workspace access with admin permissions
- Backend framework (appears to be Node.js/Express based on frontend API calls)
- Database access (PostgreSQL based on Prisma usage)
- Environment variable configuration system

### Slack Setup Steps

1. **Create Slack App**

   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name: "Rice Bikes Notifications"
   - Select your workspace

2. **Configure Incoming Webhooks**
   - Navigate to "Incoming Webhooks" in your app settings
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Select the channel for notifications (e.g., #bike-updates, #notifications)
   - Copy the webhook URL (format: `https://hooks.slack.com/services/T.../B.../...`)

---

## Backend Implementation

### 1. Slack Service Module

Create a dedicated Slack service module to handle all Slack-related functionality:

**File: `src/services/slackService.js` (or `.ts` if using TypeScript)**

```javascript
const fetch = require("node-fetch"); // or use axios

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.enabled = process.env.SLACK_NOTIFICATIONS_ENABLED === "true";
  }

  async sendNotification(payload) {
    if (!this.enabled) {
      console.log("Slack notifications disabled");
      return { success: true, message: "Notifications disabled" };
    }

    if (!this.webhookUrl) {
      console.error("Slack webhook URL not configured");
      return { success: false, message: "Webhook URL missing" };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Slack API error: ${response.status} ${response.statusText}`
        );
      }

      console.log("Slack notification sent successfully");
      return { success: true, message: "Notification sent" };
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      return { success: false, message: error.message };
    }
  }

  // Specific notification methods
  async notifyBuildComplete(transactionData) {
    const { transaction, bike, customer } = transactionData;

    const bikeInfo = bike
      ? `${bike.make} ${bike.model} (${bike.condition})`
      : "Unknown bike";

    const customerInfo = customer
      ? `${customer.first_name} ${customer.last_name}`
      : "No customer assigned";

    const message = {
      text: `🚴 Bike Build Complete!`,
      username: "Rice Bikes Bot",
      icon_emoji: ":bike:",
      attachments: [
        {
          color: "good",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num || "Unknown",
              short: true,
            },
            {
              title: "Bike",
              value: bikeInfo,
              short: true,
            },
            {
              title: "Customer",
              value: customerInfo,
              short: false,
            },
          ],
          footer: "Ready for inspection and safety check! 🔧✅",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotification(message);
  }

  async notifyReservationComplete(transactionData) {
    // Similar structure for reservation notifications
    const { transaction, bike, customer } = transactionData;

    const message = {
      text: `📋 Bike Reserved!`,
      username: "Rice Bikes Bot",
      icon_emoji: ":clipboard:",
      attachments: [
        {
          color: "warning",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num,
              short: true,
            },
            {
              title: "Customer",
              value: `${customer.first_name} ${customer.last_name}`,
              short: true,
            },
            {
              title: "Bike",
              value: `${bike.make} ${bike.model}`,
              short: false,
            },
            {
              title: "Deposit",
              value: "$50.00",
              short: true,
            },
          ],
          footer: "Customer deposit processed",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotification(message);
  }

  async notifyTransactionComplete(transactionData) {
    // Notification for final sale completion
    const { transaction, bike, customer } = transactionData;

    const message = {
      text: `💰 Sale Complete!`,
      username: "Rice Bikes Bot",
      icon_emoji: ":money_with_wings:",
      attachments: [
        {
          color: "#36a64f",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num,
              short: true,
            },
            {
              title: "Final Price",
              value: `$${transaction.total_cost}`,
              short: true,
            },
            {
              title: "Customer",
              value: `${customer.first_name} ${customer.last_name}`,
              short: false,
            },
          ],
          footer: "Bike successfully sold! 🎉",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotification(message);
  }
}

module.exports = new SlackService();
```

### 2. Notification Trigger Service

Create a service to determine when to send notifications:

**File: `src/services/notificationTriggerService.js`**

```javascript
const slackService = require("./slackService");

class NotificationTriggerService {
  async handleWorkflowStepCompletion(stepData, transactionData) {
    const { step_name, is_completed } = stepData;

    if (!is_completed) return;

    switch (step_name) {
      case "Build":
        await slackService.notifyBuildComplete(transactionData);
        break;
      case "Reservation":
        await slackService.notifyReservationComplete(transactionData);
        break;
      case "Checkout":
        await slackService.notifyTransactionComplete(transactionData);
        break;
      default:
        // No notification for this step
        break;
    }
  }

  async handleTransactionUpdate(
    oldTransaction,
    newTransaction,
    transactionData
  ) {
    // Handle specific transaction field changes
    if (!oldTransaction.is_reserved && newTransaction.is_reserved) {
      await slackService.notifyReservationComplete(transactionData);
    }

    if (!oldTransaction.is_completed && newTransaction.is_completed) {
      await slackService.notifyTransactionComplete(transactionData);
    }
  }
}

module.exports = new NotificationTriggerService();
```

---

## Database Schema Changes

### Optional: Notification Log Table

If you want to track notification history:

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(transaction_id),
  notification_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed'
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_logs_transaction_id ON notification_logs(transaction_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);
```

---

## API Endpoints

### 1. Manual Slack Notification Endpoint

**Endpoint: `POST /api/slack-notification`**

```javascript
// Route handler
router.post("/slack-notification", async (req, res) => {
  try {
    const { message, type = "manual" } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const payload = {
      text: message,
      username: "Rice Bikes Bot",
      icon_emoji: ":bike:",
    };

    const result = await slackService.sendNotification(payload);

    if (result.success) {
      res.json({
        success: true,
        message: "Notification sent successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Slack notification endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
```

### 2. Test Notification Endpoint (Development)

**Endpoint: `POST /api/slack-test`**

```javascript
router.post("/slack-test", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  try {
    const testMessage = {
      text: "🧪 Test notification from Rice Bikes system",
      username: "Rice Bikes Bot",
      icon_emoji: ":test_tube:",
      attachments: [
        {
          color: "warning",
          text: "This is a test notification to verify Slack integration is working.",
          footer: `Sent at ${new Date().toISOString()}`,
        },
      ],
    };

    const result = await slackService.sendNotification(testMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Integration Points

### 1. Workflow Step Completion Hook

Modify your existing workflow step completion endpoint:

```javascript
// In your workflow controller
async function completeWorkflowStep(req, res) {
  try {
    const { stepId } = req.params;

    // Your existing step completion logic
    const updatedStep = await WorkflowStep.update(stepId, {
      is_completed: true,
    });

    // Get full transaction data for notification
    const transactionData = await getTransactionWithDetails(
      updatedStep.transaction_id
    );

    // Trigger notification
    await notificationTriggerService.handleWorkflowStepCompletion(
      updatedStep,
      transactionData
    );

    res.json({ success: true, step: updatedStep });
  } catch (error) {
    // Handle error
    res.status(500).json({ error: error.message });
  }
}
```

### 2. Transaction Update Hook

Modify your transaction update endpoint:

```javascript
async function updateTransaction(req, res) {
  try {
    const { transactionId } = req.params;
    const updateData = req.body;

    // Get old transaction state
    const oldTransaction = await Transaction.findById(transactionId);

    // Update transaction
    const newTransaction = await Transaction.update(transactionId, updateData);

    // Get full transaction data for notification
    const transactionData = await getTransactionWithDetails(transactionId);

    // Trigger notification based on changes
    await notificationTriggerService.handleTransactionUpdate(
      oldTransaction,
      newTransaction,
      transactionData
    );

    res.json({ success: true, transaction: newTransaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 3. Helper Function for Transaction Data

```javascript
async function getTransactionWithDetails(transactionId) {
  // Adjust based on your ORM/database setup
  const transaction = await Transaction.findById(transactionId, {
    include: ["Customer", "Bike"],
  });

  return {
    transaction: transaction,
    bike: transaction.Bike,
    customer: transaction.Customer,
  };
}
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
SLACK_NOTIFICATIONS_ENABLED=true
SLACK_CHANNEL_OVERRIDE=#bike-updates  # Optional: override default channel

# Notification Settings
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_TIMEOUT_MS=5000
```

### Config Module

**File: `src/config/notifications.js`**

```javascript
module.exports = {
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === "true",
    channelOverride: process.env.SLACK_CHANNEL_OVERRIDE,
    retryAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3,
    timeoutMs: parseInt(process.env.NOTIFICATION_TIMEOUT_MS) || 5000,
  },
};
```

---

## Testing Strategy

### 1. Unit Tests

```javascript
// Test file: tests/services/slackService.test.js
const slackService = require("../../src/services/slackService");
const fetch = require("node-fetch");

jest.mock("node-fetch");

describe("SlackService", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test("should send notification successfully", async () => {
    fetch.mockResolvedValue({ ok: true });

    const result = await slackService.sendNotification({
      text: "Test message",
    });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      process.env.SLACK_WEBHOOK_URL,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  test("should handle notification failure", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    const result = await slackService.sendNotification({
      text: "Test message",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Network error");
  });
});
```

### 2. Integration Tests

```javascript
// Test actual notification flow
describe("Notification Integration", () => {
  test("should send notification when build step completes", async () => {
    // Create test transaction
    const transaction = await createTestTransaction();

    // Complete build step
    const response = await request(app)
      .put(`/api/workflow-steps/${buildStep.id}/complete`)
      .expect(200);

    // Verify notification was triggered (mock or check logs)
    expect(mockSlackService.notifyBuildComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({ id: transaction.id }),
      })
    );
  });
});
```

### 3. Manual Testing Checklist

- [ ] Test notification endpoint with curl
- [ ] Verify notification appears in correct Slack channel
- [ ] Test with disabled notifications
- [ ] Test with invalid webhook URL
- [ ] Test message formatting and attachments
- [ ] Verify error handling and logging

---

## Security Considerations

### 1. Webhook URL Security

- Store webhook URL in environment variables only
- Never commit webhook URLs to version control
- Use different webhooks for different environments
- Rotate webhook URLs periodically

### 2. Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: "Too many notification requests from this IP",
});

app.use("/api/slack-notification", notificationLimiter);
```

### 3. Input Validation

```javascript
const { body, validationResult } = require("express-validator");

const validateNotificationInput = [
  body("message").isString().isLength({ min: 1, max: 4000 }),
  body("type").optional().isIn(["manual", "auto"]),
];

router.post("/slack-notification", validateNotificationInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... rest of handler
});
```

---

## Error Handling & Monitoring

### 1. Logging Strategy

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/notifications.log" }),
    new winston.transports.Console(),
  ],
});

// Usage in SlackService
logger.info("Slack notification sent", {
  transactionId,
  notificationType: "build_complete",
  timestamp: new Date().toISOString(),
});

logger.error("Slack notification failed", {
  error: error.message,
  transactionId,
  attempt: retryCount,
});
```

### 2. Retry Logic

```javascript
async function sendNotificationWithRetry(payload, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await this.sendNotification(payload);
      if (result.success) return result;

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      logger.error(`Slack notification attempt ${attempt} failed`, {
        error: error.message,
      });

      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }
}
```

### 3. Health Check Endpoint

```javascript
router.get("/health/notifications", async (req, res) => {
  const health = {
    slack: {
      configured: !!process.env.SLACK_WEBHOOK_URL,
      enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === "true",
      lastTest: null,
      status: "unknown",
    },
  };

  if (health.slack.configured && health.slack.enabled) {
    try {
      // Send a minimal test to validate webhook
      await slackService.sendNotification({
        text: "🔍 Health check - system operational",
      });
      health.slack.status = "healthy";
      health.slack.lastTest = new Date().toISOString();
    } catch (error) {
      health.slack.status = "unhealthy";
      health.slack.error = error.message;
    }
  }

  res.json(health);
});
```

---

## Deployment Steps

### 1. Pre-deployment Checklist

- [ ] Slack webhook URL configured in production environment
- [ ] Environment variables set correctly
- [ ] Test notifications work in staging
- [ ] Database migrations run (if using notification logs)
- [ ] Monitoring and logging configured

### 2. Deployment Process

1. **Deploy backend changes**

   ```bash
   # Deploy with feature flag disabled initially
   SLACK_NOTIFICATIONS_ENABLED=false npm run deploy
   ```

2. **Verify deployment**

   ```bash
   curl https://yourapi.com/health/notifications
   ```

3. **Enable notifications gradually**

   ```bash
   # Enable for specific transaction types first
   # Then enable for all notifications
   ```

4. **Monitor logs**
   ```bash
   tail -f logs/notifications.log
   ```

### 3. Rollback Plan

If issues occur:

1. Set `SLACK_NOTIFICATIONS_ENABLED=false`
2. Restart application
3. Investigate logs
4. Fix issues and redeploy

---

## Future Enhancements

### 1. Advanced Features

- **Custom notification templates** based on transaction type
- **User preferences** for notification types
- **Multiple Slack channels** for different notification types
- **Slack threading** for related notifications
- **Rich formatting** with bike images and links

### 2. Additional Integrations

- **Email notifications** as fallback
- **SMS notifications** for critical updates
- **Discord integration** for alternative messaging
- **Microsoft Teams** for enterprise environments

### 3. Analytics & Reporting

- **Notification delivery rates**
- **User engagement metrics**
- **Performance monitoring**
- **A/B testing for message formats**

---

## Support & Documentation

### 1. Troubleshooting Guide

**Common Issues:**

- Webhook URL not working → Check Slack app permissions
- Messages not appearing → Verify channel permissions
- Rate limiting → Implement exponential backoff
- Formatting issues → Test with Slack's message builder

### 2. Message Format Examples

```javascript
// Simple message
{
  "text": "🚴 Bike build completed for Transaction #12345"
}

// Rich message with attachments
{
  "text": "🚴 Bike Build Complete!",
  "attachments": [
    {
      "color": "good",
      "fields": [
        { "title": "Transaction", "value": "#12345", "short": true },
        { "title": "Bike", "value": "Trek FX 3", "short": true }
      ]
    }
  ]
}
```

### 3. API Documentation

Document all notification endpoints in your API documentation:

- Request/response formats
- Error codes and meanings
- Rate limiting information
- Authentication requirements

---

This implementation plan provides a comprehensive foundation for adding Slack webhook notifications to your Rice Bikes backend system. The modular approach allows for gradual implementation and easy maintenance.
