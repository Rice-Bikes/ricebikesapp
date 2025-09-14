# Bike Sales Process System - Implementation Plan (Revised)

## Overview

This document outlines the implementation plan for the bike sales process system, which transforms the existing transaction workflow from a simple form-based approach to a comprehensive step-by-step sales process for "Retrospec" bike transactions.

**REVISED APPROACH**: Instead of creating a separate `bike_sales_processes` table, we'll leverage the existing `TransactionDetails` system, which is already designed for exactly this use case - tracking individual items/steps within a transaction.

## Problem Statement

The current transaction system works well for simple transactions but doesn't support:

1. **Multi-step workflows** that require different people to complete different phases
2. **Cross-session persistence** where work can be paused and resumed
3. **Process tracking** to see what stage a bike sale is in
4. **Handoff between team members** (e.g., mechanic → sales person → manager)

## Solution Architecture (Revised)

### Why Use TransactionDetails Instead of a New Table?

The existing `TransactionDetails` system is **perfect** for our use case:

```typescript
// Current TransactionDetails structure:
{
  transaction_detail_id: string,    // Unique ID for this step
  transaction_id: string,           // Links to main transaction
  completed: boolean,               // Whether this step is done
  changed_by: string,               // Who worked on this step
  date_modified: string,            // When it was last updated
  quantity: number,                 // Can be repurposed for step order
  // Plus custom fields for step-specific data
}
```

**Perfect alignment with our needs:**

- ✅ **Multi-step tracking**: Each step = one TransactionDetail record
- ✅ **Cross-session persistence**: Already built-in
- ✅ **User assignment**: `changed_by` field tracks who worked on it
- ✅ **Progress tracking**: `completed` field per step
- ✅ **Extensible**: Can add step-specific data via custom fields
- ✅ **Existing API endpoints**: Already implemented and working
- ✅ **Proven architecture**: Currently used for repairs and items

### Database Schema (Revised - Much Simpler)

#### Extend TransactionDetails with BikeStepDetails

```sql
-- No new table needed! Just extend the existing pattern
-- Add a new step_type and step-specific fields

-- The existing transaction_details table already has:
-- transaction_detail_id, transaction_id, completed, changed_by, date_modified, quantity

-- We just need to add a discriminator and step data:
ALTER TABLE transaction_details ADD COLUMN step_type VARCHAR(20);
ALTER TABLE transaction_details ADD COLUMN step_name VARCHAR(50);
ALTER TABLE transaction_details ADD COLUMN step_data JSONB;

-- Add check constraint for bike steps
ALTER TABLE transaction_details ADD CONSTRAINT check_bike_step_types
  CHECK (step_type IS NULL OR step_type IN ('bike_creation', 'bike_build', 'bike_reservation', 'bike_checkout'));
```

#### Step Data Examples

```json
// Creation Step (quantity = 1 for step order)
{
  "transaction_detail_id": "step_123_creation",
  "transaction_id": "txn_456",
  "step_type": "bike_creation",
  "step_name": "Customer & Bike Selection",
  "completed": true,
  "changed_by": "user_789",
  "quantity": 1,
  "step_data": {
    "bike_selected": true,
    "customer_confirmed": true,
    "bike_details": { "make": "Trek", "model": "FX3" }
  }
}

// Build Step (quantity = 2)
{
  "transaction_detail_id": "step_123_build",
  "transaction_id": "txn_456",
  "step_type": "bike_build",
  "step_name": "Build & Inspection",
  "completed": false,
  "changed_by": "mechanic_001",
  "quantity": 2,
  "step_data": {
    "started_at": "2025-09-02T10:30:00Z",
    "inspection_completed": false,
    "quality_check_passed": false,
    "notes": "In progress - adjusting brakes"
  }
}
```

### TypeScript Schema Extension

Add to the existing schema file:

```typescript
// Extend the existing pattern
export const BikeStepDetailsSchema = {
  $id: "bikeStepDetailsSchema.json",
  type: "object",
  properties: {
    ...TransactionDetailsSchema.properties,
    step_type: {
      type: "string",
      enum: [
        "bike_creation",
        "bike_build",
        "bike_reservation",
        "bike_checkout",
      ],
    },
    step_name: { type: "string" },
    step_data: { type: "object" },
  },
  required: [...TransactionDetailsSchema.required, "step_type", "step_name"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export type BikeStepDetails = FromSchema<typeof BikeStepDetailsSchema>;
```

### API Endpoints (Already Exist!)

The beauty of this approach is that **the API endpoints already exist**:

```typescript
// These endpoints already work for TransactionDetails:

GET    /api/transactionDetails/:transactionId?type=bike_step
POST   /api/transactionDetails        // Create new step
PUT    /api/transactionDetails/:id    // Update step completion
DELETE /api/transactionDetails/:id    // Remove step

// The existing DBModel.fetchTransactionDetails already supports filtering by type!
```

### Backend Changes Required (Minimal)

1. **Add new TransactionDetailType**:

```typescript
// In model.ts
type TransactionDetailType = "item" | "repair" | "bike_step";
```

2. **Extend the existing fetchTransactionDetails**:

```typescript
// Already supports type filtering - just add "bike_step" as valid type
DBModel.fetchTransactionDetails(transaction_id, "bike_step");
```

3. **Add step initialization on Retrospec transaction creation**:

```typescript
// When creating a Retrospec transaction, also create the 4 step records
const bikeSteps = [
  {
    step_type: "bike_creation",
    step_name: "Customer & Bike Selection",
    quantity: 1,
    completed: false,
  },
  {
    step_type: "bike_build",
    step_name: "Build & Inspection",
    quantity: 2,
    completed: false,
  },
  {
    step_type: "bike_reservation",
    step_name: "Reservation & Deposit",
    quantity: 3,
    completed: false,
  },
  {
    step_type: "bike_checkout",
    step_name: "Final Payment",
    quantity: 4,
    completed: false,
  },
];
```

## Benefits of Using TransactionDetails

### 1. **Zero New Infrastructure**

- No new database tables
- No new API endpoints
- No new authentication/authorization logic
- Leverages existing, proven architecture

### 2. **Consistent with Existing Patterns**

- Repairs and Items already use this pattern
- Developers already understand the model
- Same APIs, same validation, same error handling

### 3. **Built-in Features We Get for Free**

- User assignment tracking (`changed_by`)
- Completion status tracking (`completed`)
- Modification timestamps (`date_modified`)
- Transaction association (`transaction_id`)
- Extensible data storage (`step_data` JSONB field)

### 4. **Query Capabilities**

```sql
-- Get all incomplete bike steps for a transaction
SELECT * FROM transaction_details
WHERE transaction_id = 'txn_123'
  AND step_type LIKE 'bike_%'
  AND completed = false
ORDER BY quantity;

-- Find all bike builds currently assigned to a mechanic
SELECT * FROM transaction_details
WHERE step_type = 'bike_build'
  AND completed = false
  AND changed_by = 'mechanic_001';

-- Get progress summary for all bike transactions
SELECT transaction_id,
       COUNT(*) as total_steps,
       SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_steps
FROM transaction_details
WHERE step_type LIKE 'bike_%'
GROUP BY transaction_id;
```

## Implementation Strategy (Revised)

### Phase 1: Schema Extension (High Priority)

1. Add `step_type`, `step_name`, `step_data` columns to `transaction_details`
2. Add `bike_step` to `TransactionDetailType`
3. Create `BikeStepDetailsSchema` in schema.ts
4. Add step creation trigger for Retrospec transactions

### Phase 2: Frontend Integration (Medium Priority)

1. Update BikeSalesProcessProvider to use `fetchTransactionDetails("bike_step")`
2. Update step components to work with TransactionDetails format
3. Replace custom API calls with existing DBModel methods

### Phase 3: Enhanced Features (Low Priority)

1. Dashboard showing all active bike processes
2. Step assignment and handoff features
3. Analytics and reporting
4. Mobile optimization

## Database Migration

```sql
-- Simple migration - just extend existing table
ALTER TABLE transaction_details
  ADD COLUMN step_type VARCHAR(20),
  ADD COLUMN step_name VARCHAR(50),
  ADD COLUMN step_data JSONB;

-- Add constraint for valid step types
ALTER TABLE transaction_details
  ADD CONSTRAINT check_bike_step_types
  CHECK (step_type IS NULL OR step_type IN (
    'bike_creation', 'bike_build', 'bike_reservation', 'bike_checkout'
  ));

-- Add index for performance
CREATE INDEX idx_transaction_details_step_type ON transaction_details(step_type)
  WHERE step_type IS NOT NULL;
```

## Frontend Changes Required

### 1. Update BikeSalesProcessProvider

Replace custom API calls with existing DBModel methods:

```typescript
// Instead of fetch('/api/bike-sales-process/...')
// Use existing:
const bikeSteps = await DBModel.fetchTransactionDetails(
  transactionId,
  "bike_step"
);
```

### 2. Update Step Components

Change from custom step data format to TransactionDetails format:

```typescript
// Instead of process.step_data.creation.bike_selected
// Use: bikeSteps.find(s => s.step_type === 'bike_creation')?.completed
```

### 3. Step Management

```typescript
// Create new step
await DBModel.createTransactionDetail({
  transaction_id: transactionId,
  step_type: "bike_creation",
  step_name: "Customer & Bike Selection",
  quantity: 1,
  completed: false,
  step_data: { bike_selected: false, customer_confirmed: false },
});

// Update step
await DBModel.updateTransactionDetail(stepId, {
  completed: true,
  changed_by: userId,
  step_data: { ...existingData, bike_selected: true },
});
```

## Integration Strategy

### 1. Transaction Creation Flow

When a "Retrospec" transaction is created:

1. Standard transaction gets created in `transactions` table
2. Corresponding `BikeSalesProcess` gets created automatically
3. User gets redirected to `/bike-transaction/:transaction_id`

### 2. Process Completion Flow

When bike sales process completes:

1. Update main transaction: `is_completed = true`, `is_paid = true`, `date_completed = NOW()`
2. Update bike availability if applicable
3. Generate final receipt/documentation
4. Send confirmation notifications

### 3. Cross-Session Persistence

The system supports multiple users working on the same bike sale:

- **Mechanic** completes build and inspection
- **Sales person** handles customer reservation
- **Manager** finalizes checkout
- Each person can see current status and their assigned tasks

## Benefits of This Architecture

### 1. Separation of Concerns

- General transactions remain clean and simple
- Bike-specific workflow logic is isolated
- Easy to extend with other workflow types (e.g., repair workflows)

### 2. Scalability

- Can handle multiple concurrent bike sales
- Clear assignment and handoff between team members
- Process state is always recoverable

### 3. Auditability

- Complete history of who did what and when
- Step-by-step tracking for quality control
- Easy to identify bottlenecks in the process

### 4. Flexibility

- Easy to modify workflow steps
- Can add new step types without breaking existing data
- Support for different bike sale scenarios (new vs. refurbished)

## Alternative Approach: Extending Transaction Schema

We could add bike-specific fields directly to the `transactions` table:

```sql
ALTER TABLE transactions ADD COLUMN bike_sales_step VARCHAR(20);
ALTER TABLE transactions ADD COLUMN bike_sales_status VARCHAR(20);
ALTER TABLE transactions ADD COLUMN bike_sales_assigned_to VARCHAR;
ALTER TABLE transactions ADD COLUMN bike_sales_step_data JSONB;
```

**Pros:**

- Simpler implementation
- No additional table joins needed
- All transaction data in one place

**Cons:**

- Clutters the main transactions table
- Bike-specific fields are null for non-bike transactions
- Less flexible for future workflow types
- Harder to maintain and extend
- Violates single responsibility principle

**Recommendation:** Use the separate table approach for better architecture.

## Implementation Priority

### Phase 1: Backend API (High Priority)

1. Create database table and schema
2. Implement basic CRUD API endpoints
3. Add process creation trigger for Retrospec transactions

### Phase 2: Integration (Medium Priority)

1. Connect frontend to real API endpoints
2. Add error handling and loading states
3. Test cross-session functionality

### Phase 3: Enhancements (Low Priority)

1. Add dashboard for process management
2. Email notifications for step assignments
3. Process analytics and reporting
4. Mobile-friendly interface

## Testing Strategy

### Unit Tests

- Process state transitions
- Step validation logic
- API endpoint functionality

### Integration Tests

- Frontend-backend data flow
- Cross-session persistence
- User assignment workflows

### E2E Tests

- Complete bike sale workflow
- Multi-user collaboration scenarios
- Error recovery and edge cases

## Current Status

✅ **Frontend Implementation**: Complete with full UI and state management  
❌ **Backend API**: Not implemented (causing current JSON parsing errors)  
❌ **Database Schema**: Not created  
❌ **Integration Testing**: Blocked by missing backend

**Next Steps**: Implement the backend API endpoints to make the frontend functional.

## Files Modified/Created

### Created:

- `src/types/BikeSalesProcess.ts` - Type definitions and utility functions
- `src/hooks/BikeSalesProcessProvider.tsx` - React context provider
- `src/hooks/useBikeSalesProcess.ts` - React hook for process access
- `src/components/BikeTransactionSteps/CreationStep.tsx` - Step 1 component
- `src/components/BikeTransactionSteps/BuildStep.tsx` - Step 2 component
- `src/components/BikeTransactionSteps/ReservationStep.tsx` - Step 3 component
- `src/components/BikeTransactionSteps/CheckoutStep.tsx` - Step 4 component
- `src/features/TransactionPage/BikeTransactionPage.tsx` - Main process page

### Modified:

- `src/features/TransactionsTable/TransactionTypeDropdown.tsx` - Added Retrospec routing
- `src/app/App.tsx` - Added bike transaction route
- `src/features/TransactionPage/BikeTransactionPageWrapper.tsx` - Updated provider usage

This architecture provides a solid foundation for a comprehensive bike sales management system while maintaining clean separation from the existing transaction system.
