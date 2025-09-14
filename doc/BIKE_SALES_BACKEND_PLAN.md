# Bike Sales Backend Implementation Plan

## Overview

This document outlines the backend changes needed to support the bike sales workflow, specifically adding bike sizing and other missing fields to the bikes table and API endpoints.

## Current Status

- Frontend schema already includes `size_cm` and other bike sales fields
- Backend database and API need to be updated to match frontend expectations
- Frontend BikeSelectionStep component has been temporarily disabled for `size_cm` until backend is ready

## 1. Database Schema Updates

### Update Bikes Table

```sql
-- Add missing columns to the bikes table
ALTER TABLE bikes
ADD COLUMN IF NOT EXISTS bike_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS size_cm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'Used',
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reservation_customer_id UUID REFERENCES customers(customer_id),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);

-- Add constraints for data validation
ALTER TABLE bikes
ADD CONSTRAINT bikes_size_cm_check CHECK (size_cm >= 30 AND size_cm <= 80),
ADD CONSTRAINT bikes_condition_check CHECK (condition IN ('New', 'Refurbished', 'Used')),
ADD CONSTRAINT bikes_price_check CHECK (price >= 0),
ADD CONSTRAINT bikes_weight_check CHECK (weight_kg > 0),
ADD CONSTRAINT bikes_deposit_check CHECK (deposit_amount >= 0);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bikes_bike_type ON bikes(bike_type);
CREATE INDEX IF NOT EXISTS idx_bikes_size_cm ON bikes(size_cm);
CREATE INDEX IF NOT EXISTS idx_bikes_condition ON bikes(condition);
CREATE INDEX IF NOT EXISTS idx_bikes_is_available ON bikes(is_available);
CREATE INDEX IF NOT EXISTS idx_bikes_reservation_customer ON bikes(reservation_customer_id);
```

### Field Descriptions

| Field                     | Type          | Description                                 | Constraints            |
| ------------------------- | ------------- | ------------------------------------------- | ---------------------- |
| `bike_type`               | VARCHAR(50)   | Type of bike (Road, Mountain, Hybrid, etc.) | Optional               |
| `size_cm`                 | DECIMAL(5,2)  | Frame size in centimeters                   | 30-80cm range          |
| `condition`               | VARCHAR(20)   | Bike condition                              | New, Refurbished, Used |
| `price`                   | DECIMAL(10,2) | Sale price of the bike                      | >= 0                   |
| `is_available`            | BOOLEAN       | Whether bike is available for sale          | Default true           |
| `weight_kg`               | DECIMAL(5,2)  | Bike weight in kilograms                    | > 0                    |
| `reservation_customer_id` | UUID          | Customer who has reserved the bike          | FK to customers        |
| `deposit_amount`          | DECIMAL(10,2) | Deposit amount paid                         | >= 0                   |

## 2. Backend API Updates

### Bikes Controller (`bikes.js`)

#### Create Bike Endpoint

```javascript
const createBike = async (req, res) => {
  try {
    const {
      make,
      model,
      description,
      bike_type,
      size_cm,
      condition = "Used",
      price,
      is_available = true,
      weight_kg,
      deposit_amount,
    } = req.body;

    // Validation
    if (!make || !model || !description) {
      return res.status(400).json({
        success: false,
        message: "Make, model, and description are required",
      });
    }

    if (size_cm && (size_cm < 30 || size_cm > 80)) {
      return res.status(400).json({
        success: false,
        message: "Size must be between 30cm and 80cm",
      });
    }

    if (condition && !["New", "Refurbished", "Used"].includes(condition)) {
      return res.status(400).json({
        success: false,
        message: "Condition must be New, Refurbished, or Used",
      });
    }

    const bikeId = uuidv4();

    const query = `
      INSERT INTO bikes (
        bike_id, make, model, description, bike_type, 
        size_cm, condition, price, is_available, 
        weight_kg, deposit_amount, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const values = [
      bikeId,
      make,
      model,
      description,
      bike_type,
      size_cm,
      condition,
      price,
      is_available,
      weight_kg,
      deposit_amount,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Bike created successfully",
      responseObject: result.rows[0],
      statusCode: 201,
    });
  } catch (error) {
    console.error("Error creating bike:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
```

#### Get Bikes Endpoint

```javascript
const getBikes = async (req, res) => {
  try {
    const query = `
      SELECT 
        bike_id, make, model, description, bike_type,
        size_cm, condition, price, is_available,
        weight_kg, reservation_customer_id, deposit_amount,
        date_created
      FROM bikes 
      ORDER BY date_created DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      message: "Bikes retrieved successfully",
      responseObject: result.rows,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching bikes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
```

#### Update Bike Endpoint

```javascript
const updateBike = async (req, res) => {
  try {
    const { bike_id } = req.params;
    const {
      make,
      model,
      description,
      bike_type,
      size_cm,
      condition,
      price,
      is_available,
      weight_kg,
      reservation_customer_id,
      deposit_amount,
    } = req.body;

    // Build dynamic query for partial updates
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (make !== undefined) {
      updates.push(`make = $${paramCount++}`);
      values.push(make);
    }
    if (model !== undefined) {
      updates.push(`model = $${paramCount++}`);
      values.push(model);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (bike_type !== undefined) {
      updates.push(`bike_type = $${paramCount++}`);
      values.push(bike_type);
    }
    if (size_cm !== undefined) {
      if (size_cm < 30 || size_cm > 80) {
        return res.status(400).json({
          success: false,
          message: "Size must be between 30cm and 80cm",
        });
      }
      updates.push(`size_cm = $${paramCount++}`);
      values.push(size_cm);
    }
    if (condition !== undefined) {
      if (!["New", "Refurbished", "Used"].includes(condition)) {
        return res.status(400).json({
          success: false,
          message: "Condition must be New, Refurbished, or Used",
        });
      }
      updates.push(`condition = $${paramCount++}`);
      values.push(condition);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }
    if (weight_kg !== undefined) {
      updates.push(`weight_kg = $${paramCount++}`);
      values.push(weight_kg);
    }
    if (reservation_customer_id !== undefined) {
      updates.push(`reservation_customer_id = $${paramCount++}`);
      values.push(reservation_customer_id);
    }
    if (deposit_amount !== undefined) {
      updates.push(`deposit_amount = $${paramCount++}`);
      values.push(deposit_amount);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    values.push(bike_id);
    const query = `
      UPDATE bikes 
      SET ${updates.join(", ")}
      WHERE bike_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bike not found",
      });
    }

    res.json({
      success: true,
      message: "Bike updated successfully",
      responseObject: result.rows[0],
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error updating bike:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
```

### Transactions Controller Updates (`transactions.js`)

#### Enhanced Get Transaction Endpoint

```javascript
const getTransaction = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const query = `
      SELECT 
        t.*,
        c.first_name, c.last_name, c.email, c.phone,
        b.bike_id, b.make, b.model, b.description as bike_description,
        b.bike_type, b.size_cm, b.condition, b.price as bike_price,
        b.is_available, b.weight_kg, b.reservation_customer_id, b.deposit_amount
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN bikes b ON t.bike_id = b.bike_id
      WHERE t.transaction_id = $1
    `;

    const result = await pool.query(query, [transaction_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const row = result.rows[0];

    // Structure the response to match frontend expectations
    const transaction = {
      transaction_id: row.transaction_id,
      transaction_num: row.transaction_num,
      customer_id: row.customer_id,
      bike_id: row.bike_id,
      transaction_type: row.transaction_type,
      total_cost: row.total_cost,
      description: row.description,
      is_completed: row.is_completed,
      is_paid: row.is_paid,
      is_refurb: row.is_refurb,
      is_urgent: row.is_urgent,
      is_nuclear: row.is_nuclear,
      is_beer_bike: row.is_beer_bike,
      is_reserved: row.is_reserved,
      is_waiting_on_email: row.is_waiting_on_email,
      date_created: row.date_created,
      date_completed: row.date_completed,
      Customer: row.customer_id
        ? {
            customer_id: row.customer_id,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone,
          }
        : null,
      Bike: row.bike_id
        ? {
            bike_id: row.bike_id,
            make: row.make,
            model: row.model,
            description: row.bike_description,
            bike_type: row.bike_type,
            size_cm: row.size_cm,
            condition: row.condition,
            price: row.bike_price,
            is_available: row.is_available,
            weight_kg: row.weight_kg,
            reservation_customer_id: row.reservation_customer_id,
            deposit_amount: row.deposit_amount,
          }
        : null,
    };

    res.json({
      success: true,
      message: "Transaction retrieved successfully",
      responseObject: transaction,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
```

## 3. Migration Script

Create `migrations/add_bike_sales_fields.sql`:

```sql
-- Migration: Add bike sales fields
-- Date: 2025-09-04
-- Description: Add fields needed for bike sales workflow

BEGIN;

-- Add new columns to bikes table
ALTER TABLE bikes
ADD COLUMN IF NOT EXISTS bike_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS size_cm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'Used',
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS reservation_customer_id UUID,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);

-- Add foreign key constraint for reservation_customer_id
ALTER TABLE bikes
ADD CONSTRAINT fk_bikes_reservation_customer
FOREIGN KEY (reservation_customer_id) REFERENCES customers(customer_id);

-- Add check constraints
ALTER TABLE bikes
ADD CONSTRAINT bikes_size_cm_check CHECK (size_cm IS NULL OR (size_cm >= 30 AND size_cm <= 80)),
ADD CONSTRAINT bikes_condition_check CHECK (condition IN ('New', 'Refurbished', 'Used')),
ADD CONSTRAINT bikes_price_check CHECK (price IS NULL OR price >= 0),
ADD CONSTRAINT bikes_weight_check CHECK (weight_kg IS NULL OR weight_kg > 0),
ADD CONSTRAINT bikes_deposit_check CHECK (deposit_amount IS NULL OR deposit_amount >= 0);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bikes_bike_type ON bikes(bike_type);
CREATE INDEX IF NOT EXISTS idx_bikes_size_cm ON bikes(size_cm);
CREATE INDEX IF NOT EXISTS idx_bikes_condition ON bikes(condition);
CREATE INDEX IF NOT EXISTS idx_bikes_is_available ON bikes(is_available);
CREATE INDEX IF NOT EXISTS idx_bikes_reservation_customer ON bikes(reservation_customer_id);

-- Update any existing bikes with default values if needed
UPDATE bikes
SET
  condition = 'Used',
  is_available = true
WHERE condition IS NULL OR is_available IS NULL;

COMMIT;
```

## 4. Testing Plan

### API Tests (`tests/bikes.test.js`)

```javascript
describe("Bikes API with Sales Fields", () => {
  test("Create bike with all fields", async () => {
    const bikeData = {
      make: "Trek",
      model: "FX 3",
      description: "Hybrid bike in excellent condition",
      bike_type: "Hybrid",
      size_cm: 54,
      condition: "Refurbished",
      price: 350,
      is_available: true,
      weight_kg: 12.5,
    };

    const response = await request(app)
      .post("/bikes")
      .send(bikeData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.responseObject.size_cm).toBe(54);
    expect(response.body.responseObject.condition).toBe("Refurbished");
  });

  test("Validate size_cm constraints", async () => {
    const bikeData = {
      make: "Test",
      model: "Test",
      description: "Test",
      size_cm: 100, // Invalid - too large
    };

    await request(app).post("/bikes").send(bikeData).expect(400);
  });

  test("Update bike with partial fields", async () => {
    // Test updating only size_cm and condition
    const updateData = {
      size_cm: 56,
      condition: "Used",
    };

    const response = await request(app)
      .patch("/bikes/existing-bike-id")
      .send(updateData)
      .expect(200);

    expect(response.body.responseObject.size_cm).toBe(56);
    expect(response.body.responseObject.condition).toBe("Used");
  });

  test("Validate condition values", async () => {
    const bikeData = {
      make: "Test",
      model: "Test",
      description: "Test",
      condition: "Broken", // Invalid condition
    };

    await request(app).post("/bikes").send(bikeData).expect(400);
  });
});

describe("Transactions API with Bike Data", () => {
  test("Get transaction includes full bike data", async () => {
    const response = await request(app)
      .get("/transactions/valid-transaction-id")
      .expect(200);

    expect(response.body.responseObject.Bike).toBeDefined();
    expect(response.body.responseObject.Bike.size_cm).toBeDefined();
    expect(response.body.responseObject.Bike.condition).toBeDefined();
  });
});
```

### Manual Testing Checklist

- [ ] Create bike with all new fields
- [ ] Create bike with only required fields (make, model, description)
- [ ] Update bike with partial data
- [ ] Validate size_cm constraints (30-80 range)
- [ ] Validate condition enum values
- [ ] Test foreign key constraint for reservation_customer_id
- [ ] Verify indexes are created and performant
- [ ] Test transaction endpoint returns complete bike data

## 5. Frontend Re-enablement

After backend deployment, update the frontend:

### BikeSelectionStep.tsx Changes

1. **Uncomment all TODO sections** related to `size_cm`
2. **Re-enable size input field**
3. **Re-enable size validation**
4. **Re-enable size display in preview chips**
5. **Test existing bike data population on rollback**

### Files to Update

- `/src/components/BikeTransactionSteps/BikeSelectionStep.tsx`
  - Uncomment `size_cm` in state initialization
  - Uncomment size field in mutation function
  - Uncomment size validation
  - Uncomment size input handlers
  - Uncomment size UI elements

## 6. Deployment Steps

1. **Database Migration**

   ```bash
   # Run migration script
   psql -d ricebikes_db -f migrations/add_bike_sales_fields.sql
   ```

2. **Backend Code Deployment**

   - Update bikes controller with new endpoints
   - Update transactions controller for enhanced bike data
   - Deploy backend changes

3. **Frontend Code Updates**

   - Uncomment all TODO sections in BikeSelectionStep.tsx
   - Test bike creation and editing workflow
   - Test transaction display with full bike data

4. **Testing**
   - Run API tests
   - Manual testing of bike workflow
   - Verify data integrity and constraints

## 7. Rollback Plan

If issues arise:

1. **Keep frontend changes commented** until backend is stable
2. **Database rollback** (if needed):
   ```sql
   -- Remove constraints
   ALTER TABLE bikes DROP CONSTRAINT IF EXISTS bikes_size_cm_check;
   ALTER TABLE bikes DROP CONSTRAINT IF EXISTS bikes_condition_check;
   -- Remove columns (use with caution)
   ALTER TABLE bikes DROP COLUMN IF EXISTS size_cm;
   -- etc.
   ```

## Success Criteria

- [ ] Bikes can be created with size_cm and other new fields
- [ ] Size validation works (30-80cm range)
- [ ] Condition validation works (New/Refurbished/Used)
- [ ] Transaction endpoints return complete bike data
- [ ] Frontend BikeSelectionStep works with size input
- [ ] Bike data persists when rolling back to BikeSpec step
- [ ] All existing functionality remains unaffected

## Notes

- The frontend schema already includes these fields, so this is primarily a backend catch-up effort
- Size constraints allow for standard bike frame sizes (30-80cm covers most adult bikes)
- All new fields are nullable to maintain backward compatibility
- Foreign key constraint on reservation_customer_id enables bike reservation workflow
