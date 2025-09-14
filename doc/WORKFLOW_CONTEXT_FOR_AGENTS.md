# WorkflowSteps System Context for Development

## System Overview

The Rice Bikes backend now includes a **WorkflowSteps system** - a generalized step-tracking framework designed to monitor multi-step business processes. This system was specifically built to handle bike sales workflows but is extensible to support any sequential business process.

## Core Architecture

### Database Schema
```sql
Table: WorkflowSteps
- step_id (UUID, Primary Key)
- transaction_id (UUID, Foreign Key → Transactions)
- workflow_type (VARCHAR, Enum: 'bike_sales', 'repair_process', 'order_fulfillment', 'custom_workflow')
- step_name (VARCHAR(100))
- step_order (INTEGER, Must be > 0)
- is_completed (BOOLEAN, Default: false)
- created_by (UUID, Foreign Key → Users, Required)
- completed_by (UUID, Foreign Key → Users, Optional)
- created_at (TIMESTAMP, Auto-generated)
- completed_at (TIMESTAMP, Optional)
- updated_at (TIMESTAMP, Auto-updated via trigger)
```

### API Structure
The system follows the standard 5-layer Rice Bikes architecture:
- **Model**: `/src/api/workflowSteps/workflowStepsModel.ts` - Zod validation schemas
- **Repository**: `/src/api/workflowSteps/workflowStepsRepository.ts` - Database operations
- **Service**: `/src/api/workflowSteps/workflowStepsService.ts` - Business logic
- **Controller**: `/src/api/workflowSteps/workflowStepsController.ts` - HTTP handling
- **Router**: `/src/api/workflowSteps/workflowStepsRouter.ts` - API endpoints

## Key Design Principles

### ✅ Simplified Data Model
- **No complex JSONB data** - All business logic lives in transaction data
- **Pure completion tracking** - Focus on step completion status only
- **Clean separation** - Workflow tracking separate from business data

### ✅ User Accountability
- Track who created each step (`created_by`)
- Track who completed each step (`completed_by`) 
- Full audit trail with timestamps

### ✅ Extensible Workflow Types
Current supported workflows:
- `bike_sales`: Creation → Build → Reservation → Checkout
- `repair_process`: Assessment → Parts Ordering → Repair Work → Quality Check
- `order_fulfillment`: (Future extensibility)
- `custom_workflow`: (Future extensibility)

## API Endpoints Reference

Base URL: `/workflow-steps`

### Core CRUD Operations
```
GET    /                     - List workflow steps (with filtering)
POST   /                     - Create individual step
GET    /:stepId              - Get specific step
PATCH  /:stepId              - Update step (mainly completion status)
DELETE /:stepId              - Delete step
```

### Workflow Management
```
POST   /initialize/:workflowType           - Create complete workflow for transaction
GET    /transaction/:transactionId         - Get all steps for transaction  
GET    /progress/:transactionId/:workflowType - Get progress summary
```

### Step Operations
```
PATCH  /complete/:stepId      - Mark step complete
PATCH  /uncomplete/:stepId    - Mark step incomplete
POST   /batch-complete        - Complete multiple steps
```

## Response Format

All endpoints return standardized `ServiceResponse` objects:

```typescript
{
  success: boolean,
  message: string,
  responseObject: T | null,
  statusCode: number
}
```

### Progress Response Example
```typescript
{
  "success": true,
  "message": "Workflow progress retrieved successfully",
  "responseObject": {
    "total_steps": 4,
    "completed_steps": 2, 
    "progress_percentage": 50,
    "current_step": { "step_name": "Reservation", ... },
    "is_workflow_complete": false,
    "steps_summary": [...]
  },
  "statusCode": 200
}
```

## Integration Points

### Database Dependencies
- **Transactions table**: Every workflow step must reference an existing transaction
- **Users table**: Step creation and completion require valid user references
- **Foreign key constraints**: Ensure data integrity across relationships

### Authentication & Authorization
- **JWT required**: All endpoints require valid authentication
- **User context**: User ID extracted from JWT for creation/completion tracking
- **Role compatibility**: Works with existing role-based access control

### API Integration
- **Server integration**: Registered at `/workflow-steps` in `src/server.ts`
- **OpenAPI docs**: Full Swagger documentation auto-generated
- **Error handling**: Consistent error responses using shared middleware

## Predefined Workflows

### Bike Sales Process
1. **Creation** - Initial bike selection and customer setup
2. **Build** - Physical assembly and preparation
3. **Reservation** - Customer reservation and deposit handling
4. **Checkout** - Final payment and delivery

### Repair Process
1. **Assessment** - Initial evaluation of issues
2. **Parts Ordering** - Required components procurement
3. **Repair Work** - Actual repair execution
4. **Quality Check** - Final inspection and testing

## Usage Patterns

### Initialize Complete Workflow
```typescript
POST /workflow-steps/initialize/bike_sales
Body: {
  "transaction_id": "transaction-uuid",
  "created_by": "user-uuid" // Optional, can be extracted from JWT
}
```

### Track Single Step Completion
```typescript
PATCH /workflow-steps/complete/step-uuid
Body: {
  "completed_by": "user-uuid" // Optional, can be extracted from JWT
}
```

### Monitor Workflow Progress
```typescript
GET /workflow-steps/progress/transaction-uuid/bike_sales
// Returns completion percentage, current step, and full summary
```

## Data Flow

1. **Transaction Created** → Standard transaction flow
2. **Workflow Initialized** → Creates all steps for workflow type
3. **Steps Completed** → Individual step completion as process progresses
4. **Progress Tracked** → Real-time monitoring of workflow status
5. **Workflow Complete** → All steps marked complete

## Important Constraints

### Database Level
- **Unique constraint**: Prevents duplicate `(transaction_id, workflow_type, step_order)` combinations
- **Check constraints**: Validates `step_order > 0` and workflow type enum values
- **Foreign keys**: Ensures referential integrity with Transactions and Users tables

### Application Level
- **Step ordering**: Steps must be created with positive integer ordering
- **Workflow types**: Limited to predefined enum values
- **User validation**: Created/completed by users must exist in Users table

## Files Created/Modified

### New Files
- `/src/api/workflowSteps/` - Complete 5-layer implementation
- `/migrations/001_create_workflow_steps.sql` - Database schema
- `/sample_workflow_steps_data.sql` - Test data examples
- `/WORKFLOW_STEPS_SYSTEM.md` - Full system documentation

### Integration Points
- `/src/server.ts` - Router registration
- `/prisma/schema.prisma` - WorkflowSteps model definition

## Migration Status

✅ **Database migration executed successfully**
- WorkflowSteps table created with all constraints
- Indexes created for performance
- Triggers configured for auto-updating timestamps
- Foreign key relationships established

## Testing Recommendations

### API Testing
1. Test workflow initialization for different types
2. Verify step completion/uncompletion functionality
3. Test progress tracking accuracy
4. Validate error handling for invalid data

### Database Testing
1. Verify constraint enforcement (unique steps, positive ordering)
2. Test foreign key relationships
3. Confirm trigger functionality for timestamps
4. Test cascade deletions

### Integration Testing
1. End-to-end workflow completion
2. User authentication integration
3. Transaction relationship validation
4. Multi-user workflow collaboration

## Future Extensibility

The system is designed for easy expansion:
- **New workflow types**: Add to enum and create step templates
- **Dynamic steps**: Conditional workflow paths
- **Step dependencies**: Prerequisite step completion
- **Notifications**: Integration with alert systems
- **Analytics**: Workflow performance metrics
- **Permissions**: Step-level access control

This context should provide any Copilot agent with comprehensive understanding of the WorkflowSteps system architecture, capabilities, and integration points within the Rice Bikes backend.
