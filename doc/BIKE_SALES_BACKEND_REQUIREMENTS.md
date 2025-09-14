# Backend Requirements for Bike Sales Workflow

## Current Issue

The bike sales frontend is attempting to use `detailType=bike_step` in API calls to `/transactionDetails/{transaction_id}?detailType=bike_step`, but the backend returns:

```json
{
  "success": false,
  "message": "Invalid input: Invalid input custom",
  "responseObject": null,
  "statusCode": 400
}
```

The backend currently only supports `detailType=item` and `detailType=repair`.

## Frontend Implementation Status ✅

The frontend has been fully implemented with:

- **BikeSalesProcessProvider**: Manages 4-step bike sales workflow using existing `DBModel` methods
- **BikeStepDetails Interface**: Extends `TransactionDetails` with bike-specific step data
- **4 Step Components**: Creation → Build → Reservation → Checkout workflow
- **TransactionDetailType Extended**: Frontend type now includes `"bike_step"`
- **Existing API Integration**: Uses `fetchTransactionDetails`, `postTransactionDetails`, `updateTransactionDetails`

## Required Backend Changes

### Option 1: Extend Existing TransactionDetails System (RECOMMENDED)

This approach leverages the existing, proven `TransactionDetails` infrastructure while adding bike workflow support.

#### 1.1 Database Schema Changes

**Add bike_step support to existing validation:**

```sql
-- No new tables required - leverage existing transaction_details table
-- The existing JSONB columns and structure support our bike step data

-- Verify current transaction_details structure supports:
-- - transaction_detail_id (UUID, Primary Key) ✅
-- - transaction_id (UUID, Foreign Key) ✅
-- - item_id (UUID, nullable) ✅ (will be null for bike steps)
-- - repair_id (UUID, nullable) ✅ (will be null for bike steps)
-- - changed_by (UUID, nullable) ✅
-- - completed (boolean) ✅
-- - quantity (number) ✅ (will be 1 for bike steps)
-- - date_modified (timestamp) ✅
```

#### 1.2 API Route Changes

**Update `/transactionDetails/{transaction_id}` endpoint:**

```typescript
// Current supported detailTypes: "item" | "repair"
// Required: Add "bike_step" support

// Backend validation should accept:
detailType: "item" | "repair" | "bike_step";

// For bike_step queries, return TransactionDetails records where:
// - item_id IS NULL
// - repair_id IS NULL
// - Custom bike step data stored in additional JSONB fields or metadata
```

#### 1.3 Response Format for bike_step

```json
{
  "success": true,
  "message": "transaction details found",
  "responseObject": [
    {
      "transaction_detail_id": "uuid",
      "transaction_id": "uuid",
      "item_id": null,
      "repair_id": null,
      "changed_by": "uuid",
      "completed": false,
      "quantity": 1,
      "date_modified": "2025-01-01T00:00:00.000Z",
      "step_type": "bike_creation", // bike_creation | bike_build | bike_reservation | bike_checkout
      "step_name": "Creation",
      "step_data": {
        "bike_selected": false,
        "customer_confirmed": false,
        "frame_type": null
        // ... other step-specific data
      }
    }
  ],
  "statusCode": 200
}
```

#### 1.4 Database Storage Strategy

**Extend existing transaction_details table:**

```sql
-- Option A: Add new columns (preferred for query performance)
ALTER TABLE transaction_details
ADD COLUMN step_type VARCHAR(50) NULL,
ADD COLUMN step_name VARCHAR(100) NULL,
ADD COLUMN step_data JSONB NULL;

-- Option B: Use existing structure with metadata
-- Store bike step info in existing JSONB/metadata fields
-- No schema changes needed, but requires backend parsing logic
```

#### 1.5 Backend Implementation Requirements

```typescript
// Update existing endpoint handler
// File: /routes/transactionDetails.js (or equivalent)

app.get("/transactionDetails/:transaction_id", (req, res) => {
  const { transaction_id } = req.params;
  const { detailType } = req.query;

  switch (detailType) {
    case "item":
      // Existing item logic
      break;
    case "repair":
      // Existing repair logic
      break;
    case "bike_step": // NEW
      return fetchBikeStepDetails(transaction_id, res);
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid detailType. Supported: item, repair, bike_step",
        responseObject: null,
        statusCode: 400,
      });
  }
});

async function fetchBikeStepDetails(transaction_id, res) {
  try {
    const query = `
      SELECT * FROM transaction_details 
      WHERE transaction_id = $1 
      AND item_id IS NULL 
      AND repair_id IS NULL
      AND step_type IS NOT NULL
      ORDER BY step_type;
    `;

    const result = await db.query(query, [transaction_id]);

    return res.json({
      success: true,
      message: "transaction details found",
      responseObject: result.rows,
      statusCode: 200,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Database error fetching bike steps",
      responseObject: null,
      statusCode: 500,
    });
  }
}
```

#### 1.6 POST/PUT Endpoint Updates

**Update existing transaction detail creation/update endpoints:**

```typescript
// Ensure POST /transactionDetails and PUT /transactionDetails/{id}
// can handle bike step records with:
// - step_type: string
// - step_name: string
// - step_data: JSON object
// - item_id: null
// - repair_id: null
```

### Option 2: Create Separate Bike Sales System (NOT RECOMMENDED)

This would require:

- New `bike_sales_steps` table
- New API endpoints (`/bikeSales/{transaction_id}/steps`)
- Separate frontend API integration
- Duplicated authentication/validation logic
- More complex cross-system data management

**Why Option 1 is Better:**

- ✅ Leverages existing, proven TransactionDetails infrastructure
- ✅ Maintains consistency with existing patterns
- ✅ Minimal backend changes required
- ✅ Frontend already implemented using existing API methods
- ✅ Easier testing and maintenance
- ✅ Natural integration with existing transaction system

## Implementation Priority

### Phase 1: Backend Extension (Required for MVP)

1. **Update detailType validation** to accept "bike_step"
2. **Add bike_step query handler** to existing /transactionDetails endpoint
3. **Extend database schema** with bike step columns (Option A above)
4. **Test with frontend integration**

### Phase 2: Enhanced Features (Future)

1. Add bike-specific validation rules
2. Implement step transition logic
3. Add bike inventory integration
4. Create bike sales reporting endpoints

## Testing Strategy

### Unit Tests Required

- Test `/transactionDetails/{id}?detailType=bike_step` returns proper format
- Test POST/PUT operations with bike step data
- Validate step_type enum values
- Test null item_id/repair_id handling

### Integration Tests Required

- End-to-end bike sales workflow (Creation → Checkout)
- Cross-session state persistence
- Error handling for invalid step transitions

## Migration Strategy

### Development Environment

1. Run schema migration to add bike step columns
2. Deploy backend changes
3. Test with existing frontend
4. Verify no breaking changes to existing item/repair workflows

### Production Deployment

1. **Schema migration** during maintenance window
2. **Backward-compatible deployment** (existing endpoints unchanged)
3. **Feature flag** for bike sales functionality
4. **Gradual rollout** with monitoring

## Success Criteria

- ✅ `GET /transactionDetails/{id}?detailType=bike_step` returns 200 status
- ✅ Frontend bike sales workflow completes without API errors
- ✅ Existing item/repair workflows remain unaffected
- ✅ Bike step data persists across browser sessions
- ✅ All 4 bike sales steps can be created, updated, and completed

## Current Frontend Error Resolution

Once backend changes are implemented, the current errors will be resolved:

```
❌ GET http://localhost:7130/transactionDetails/27f90c8a-16fc-44ae-8db8-b59e4557f708?detailType=bike_step 400 (Bad Request)

✅ GET http://localhost:7130/transactionDetails/27f90c8a-16fc-44ae-8db8-b59e4557f708?detailType=bike_step 200 (Success)
```

The frontend implementation is complete and ready - it only needs backend support for the `bike_step` detailType.
