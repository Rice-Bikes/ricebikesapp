import { JSONSchema } from "json-schema-to-ts";

export const partSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Part",
  type: "object",
  properties: {
    item_id: { type: "string" },
    upc: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    stock: { type: ["number", "null"] },
    minimum_stock: { type: ["number", "null"] },
    standard_price: { type: "number" },
    wholesale_cost: { type: "number" },
    condition: { type: ["string", "null"] },
    disabled: { type: ["boolean", "null"] },
    managed: { type: ["boolean", "null"] },
    category_1: { type: ["string", "null"] },
    category_2: { type: ["string", "null"] },
    category_3: { type: ["string", "null"] },
    specifications: { type: ["object", "null"] }, // Assuming JSON can be any valid JSON
    features: { type: ["array", "object", "null"] }, // Assuming JSON can be any valid JSON
  },
  required: [
    "item_id",
    "upc",
    "name",
    "stock",
    "minimum_stock",
    "standard_price",
    "wholesale_cost",
    "condition",
    "disabled",
    "managed",
    "specifications",
    "features",
  ],
} as const satisfies JSONSchema;

export const partArraySchema = {
  $id: "partArray.json",
  type: "array",
  items: partSchema,
} as const satisfies JSONSchema;

export const partResponseSchema = {
  $id: "partResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: "array" },
    statusCode: { type: "number" },
    success: { type: "boolean" },
    additionalProperties: false,
  },
  required: ["message", "responseObject", "statusCode", "success"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreatePartSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Part",
  type: "object",
  properties: {
    upc: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    stock: { type: ["number", "null"] },
    minimum_stock: { type: ["number", "null"] },
    standard_price: { type: "number" },
    wholesale_cost: { type: "number" },
    condition: { type: ["string", "null"] },
    disabled: { type: ["boolean", "null"] },
    managed: { type: ["boolean", "null"] },
    category_1: { type: ["string", "null"] },
    category_2: { type: ["string", "null"] },
    category_3: { type: ["string", "null"] },
    specifications: { type: ["object", "null"] }, // Assuming JSON can be any valid JSON
    features: { type: ["object","array", "null"] }, // Assuming JSON can be any valid JSON
  },

  required: [
    "upc",
    "name",
    "stock",
    "minimum_stock",
    "standard_price",
    "wholesale_cost",
    "disabled",
  ],
} as const satisfies JSONSchema;

export const repairSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Repair",
  type: "object",
  properties: {
    repair_id: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    price: { type: "number" },
    disabled: { type: "boolean" },
  },
  required: ["repair_id", "name", "price", "disabled", "description"],
} as const satisfies JSONSchema;

export const repairArraySchema = {
  $id: "repairArray.json",
  type: "array",
  items: repairSchema,
} as const satisfies JSONSchema;

export const repairResponseSchema = {
  $id: "repairResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: "array" },
    statusCode: { type: "number" },
    success: { type: "boolean" },
  },
  required: ["message", "responseObject", "statusCode", "success"],
} as const satisfies JSONSchema;

export const CustomerSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Customer",
  type: "object",
  properties: {
    customer_id: { type: "string" },
    first_name: { type: "string" },
    last_name: { type: "string" },
    email: { type: "string" },
    phone: { type: ["string", "null"] },
  },
  required: ["customer_id", "first_name", "last_name", "email", "phone"],

  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreateCustomerSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Customer",
  type: "object",
  properties: {
    first_name: { type: "string" },
    last_name: { type: "string" },
    email: { type: "string" },
    phone: { type: ["string", "null"] },
  },
  required: ["first_name", "last_name", "email", "phone"],

  additionalProperties: false,
} as const satisfies JSONSchema;

export const BikeSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Bike",
  type: ["object", "null"],
  properties: {
    bike_id: { type: "string" },
    make: { type: "string" },
    model: { type: "string" },
    date_created: { type: ["string", "null"] },
    description: { type: "string" },
    bike_type: { type: ["string", "null"] },
    size_cm: { type: ["number", "null"] }, // Allow both number and string
    condition: { type: ["string", "null"] },
    price: { type: ["number", "null"] }, // Allow both number and string
    is_available: { type: ["boolean", "null"] }, // Add missing field
    reservation_customer_id: { type: ["string", "null"] },
    deposit_amount: { type: ["number", "null"] }, // Allow both number and string
    weight_kg: { type: ["number", "null"] }, // Allow both number and string
  },
  required: ["make", "model", "description"],
  additionalProperties: true, // Allow additional properties for backwards compatibility
} as const satisfies JSONSchema;

export const UpdateBikeSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "UpdateBike",
  type: "object",
  properties: {
    make: { type: "string", minLength: 1 },
    model: { type: "string", minLength: 1 },
    description: { type: ["string", "null"] },
    bike_type: { type: ["string", "null"], maxLength: 50 },
    size_cm: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 80,
    },
    condition: {
      type: "string",
      enum: ["New", "Refurbished", "Used"],
    },
    price: {
      type: ["number", "null"],
      minimum: 0,
    },
    is_available: { type: "boolean" },
    weight_kg: {
      type: ["number", "null"],
      minimum: 0.1,
    },
    reservation_customer_id: {
      type: ["string", "null"],
    },
    deposit_amount: {
      type: ["number", "null"],
      minimum: 0,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

export const RoleSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Role",
  type: "object",
  properties: {
    role_id: { type: "string" },
    name: { type: ["string", "null"] },
    disabled: { type: "boolean" },
    description: { type: ["string", "null"] },
    UserRoles: { type: ["array", "null"] },
    RolePermissions: { type: ["array", "null"] },
  },
  required: ["role_id", "disabled"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const UserRolesSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "UserRoles",
  type: "object",
  properties: {
    user_id: { type: "string" },
    role_id: { type: "string" },
    User: { type: "object" },
    Role: RoleSchema,
  },
  required: ["user_id", "role_id"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const PermissionsSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Permissions",
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    description: { type: ["string"] },
    RolePermissions: { type: ["array", "null"] },
  },
  required: ["id", "name"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const RolePermissionsSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "RolePermissions",
  type: "object",
  properties: {
    role_id: { type: "string" },
    permission_id: { type: "integer" },
    Role: RoleSchema,
    Permission: PermissionsSchema,
  },
  required: ["role_id", "permission_id"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const UserSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "User",
  type: "object",
  properties: {
    user_id: { type: "string" },
    username: { type: "string" },
    firstname: { type: "string" },
    lastname: { type: "string" },
    active: { type: "boolean" },
    permissions: { type: "array", items: PermissionsSchema },
  },
  required: ["user_id", "username", "firstname", "lastname", "active"],
  additionalProperties: false,
} as const satisfies JSONSchema;

// Order Request Schema
export const OrderRequestSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "OrderRequest",
  type: "object",
  properties: {
    order_request_id: { type: "string" },
    created_by: { type: "string" },
    transaction_id: { type: "string" },
    item_id: { type: "string" },
    date_created: { type: "string" },
    quantity: { type: "integer" },
    notes: { type: ["string", "null"] },
    ordered: { type: "boolean" },
    Item: partSchema,
    User: UserSchema,
  },
  required: [
    "order_request_id",
    "created_by",
    "transaction_id",
    "item_id",
    "date_created",
    "quantity",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Transaction",
  type: "object",
  properties: {
    transaction_num: { type: "number" },
    transaction_id: { type: "string" },
    date_created: { type: "string" },
    customer_id: { type: "string" },
    transaction_type: { type: "string" },
    bike_id: { type: ["string", "null"] },
    total_cost: { type: "number" },
    description: { type: ["string", "null"] },
    is_completed: { type: "boolean" },
    is_paid: { type: "boolean" },
    is_refurb: { type: "boolean" },
    is_urgent: { type: "boolean" },
    is_nuclear: { type: ["boolean", "null"] },
    is_beer_bike: { type: "boolean" },
    is_employee: { type: "boolean" },
    is_reserved: { type: "boolean" },
    is_waiting_on_email: { type: "boolean" },
    date_completed: { type: ["string", "null"] },
    Bike: {
      type: ["object", "null"],
      properties: BikeSchema.properties,
    },
    Customer: {
      type: ["object", "null"],
      properties: CustomerSchema.properties,
    },
    OrderRequests: {
      type: ["array", "null"],
      items: OrderRequestSchema,
    },
  },
  required: [
    "transaction_num",
    "date_created",
    "transaction_type",
    "customer_id",
    "total_cost",
    "is_completed",
    "is_paid",
    "is_refurb",
    "is_urgent",
    "is_beer_bike",
    "is_employee",
    "is_reserved",
    "is_waiting_on_email",
    "transaction_id",
  ],
} as const satisfies JSONSchema;

export const CreateTransactionSchema = {
  $id: "CreateTransactionSchema.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "CreateTransactionSchema",
  type: "object",
  properties: {
    transaction_type: { type: "string" },
    customer_id: { type: "string", format: "uuid" },
    is_employee: { type: "boolean" },
  },
  required: ["transaction_type", "customer_id", "is_employee"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionArraySchema = {
  $id: "transactionArray.json",
  type: "array",
  items: TransactionSchema,
} as const satisfies JSONSchema;

export const ArrayResponseSchema = {
  $id: "ArrayResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: ["array"] },
    statusCode: { type: "number" },
    success: { type: "boolean" },
    additionalProperties: false,
  },
  required: ["message", "responseObject", "statusCode", "success"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const ObjectResponseSchema = {
  $id: "ObjectResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: ["object"] },
    statusCode: { type: "number" },
    success: { type: "boolean" },
    additionalProperties: false,
  },
  required: ["message", "responseObject", "statusCode", "success"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionDetailsSchema = {
  $id: "transactionDetails.json",
  type: "object",
  properties: {
    transaction_detail_id: { type: "string" },
    transaction_id: { type: "string" },
    item_id: { type: ["string", "null"] },
    repair_id: { type: ["string", "null"] },
    changed_by: { type: ["string", "null"] },
    completed: { type: "boolean" },
    quantity: { type: "number" },
    date_modified: { type: "string" },
  },
  required: [
    "transaction_detail_id",
    "transaction_id",
    "item_id",
    "completed",
    "quantity",
    "date_modified",
  ],
} as const satisfies JSONSchema;

export const RepairDetailsSchema = {
  $id: "repairDetailsSchema.json",
  type: "object",
  properties: {
    ...TransactionDetailsSchema.properties,
    repair_id: { type: "string" },
    Repair: repairSchema,
  },
  required: [...TransactionDetailsSchema.required, "Repair"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const ItemDetailsSchema = {
  $id: "itemDetailsSchema.json",
  type: "object",
  properties: {
    ...TransactionDetailsSchema.properties,
    item_id: { type: "string" },
    Item: partSchema,
  },
  required: [...TransactionDetailsSchema.required, "Item"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionDetailsArraySchema = {
  $id: "transactionDetailsArray.json",
  type: "array",
  items: TransactionDetailsSchema,
} as const satisfies JSONSchema;

export const CreateTransactionDetailsSchema = {
  $id: "CreateTransactionSchema.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "CreateTransactionSchema",
  type: "object",
  properties: {
    item_id: { type: ["string", "null"] },
    repair_id: { type: ["string", "null"], format: "uuid" },
    changed_by: { type: "string", format: "uuid" },
    quantity: { type: "integer" },
  },
  required: ["changed_by", "quantity"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const updateTransactionSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Transaction",
  type: "object",
  properties: {
    transaction_type: { type: "string" },
    customer_id: { type: "string", nullable: true },
    bike_id: { type: "string", nullable: true },
    total_cost: { type: "number" },
    description: { type: "string", nullable: true },
    is_completed: { type: "boolean" },
    is_paid: { type: "boolean" },
    is_refurb: { type: "boolean" },
    is_urgent: { type: "boolean" },
    is_nuclear: { type: "boolean", nullable: true },
    is_beer_bike: { type: "boolean" },
    is_reserved: { type: "boolean" },
    is_waiting_on_email: { type: "boolean" },
    date_completed: { type: "string", nullable: true },
  },

  required: [
    "transaction_type",
    "total_cost",
    "is_completed",
    "is_paid",
    "is_refurb",
    "is_urgent",
    "is_beer_bike",
    "is_reserved",
    "is_waiting_on_email",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionSummarySchema = {
  $id: "transactionSummary.json",
  type: "object",
  properties: {
    quantity_incomplete: { type: "number" },
    quantity_beer_bike_incomplete: { type: "number" },
    quantity_waiting_on_pickup: { type: "number" },
    quantity_waiting_on_safety_check: { type: "number" },
    additionalProperties: false,
  },
  required: [
    "quantity_incomplete",
    "quantity_beer_bike_incomplete",
    "quantity_waiting_on_pickup",
    "quantity_waiting_on_safety_check",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreateOrderRequestsSchema = {
  $id: "CreateOrderRequestsSchema.json",
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        created_by: { type: "string", format: "uuid" },
        transaction_id: { type: "string", format: "uuid" },
        item_id: { type: "string", format: "uuid" },
        quantity: { type: "integer" },
        notes: { type: ["string", "null"] },
        Item: partSchema,
        User: UserSchema,
      },
      required: ["created_by", "transaction_id", "item_id", "quantity"],
    },
  },
  required: ["body"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreateTransactionLogSchema = {
  $id: "CreateTransactionLogSchema.json",
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        item_id: { type: ["string", "null"] },
        repair_id: { type: ["string", "null"], format: "uuid" },
        changed_by: { type: "string", format: "uuid" },
        quantity: { type: "integer" },
      },
      required: ["changed_by", "quantity"],
    },
  },
  required: ["body"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionLogSchema = {
  $id: "transactionLog.json",
  type: "object",
  properties: {
    log_id: { type: "string" },
    transaction_num: { type: "number" },
    changed_by: { type: "string" },
    date_modified: { type: "string" },
    change_type: { type: "string" },
    description: { type: "string" },
    Users: UserSchema,
  },
  required: [
    "log_id",
    "transaction_num",
    "changed_by",
    "date_modified",
    "change_type",
    "description",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const TransactionLogArraySchema = {
  $id: "transactionLogArray.json",
  type: "array",
  items: TransactionLogSchema,
} as const satisfies JSONSchema;

export const FeatureFlagSchema = {
  $id: "featureFlag.json",
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["name", "isActive", "createdAt", "updatedAt"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const OrderSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Order",
  type: "object",
  properties: {
    order_id: { type: "string", format: "uuid" },
    order_date: { type: "string", format: "date-time" },
    estimated_delivery: { type: "string", format: "date-time" },
    supplier: { type: "string" },
    ordered_by: { type: "string" },
  },
  required: [
    "order_id",
    "order_date",
    "estimated_delivery",
    "supplier",
    "ordered_by",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreateOrderSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "CreateOrder",
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        supplier: { type: "string" },
        ordered_by: { type: "string" },
        order_date: { type: "string", format: "date-time" },
        estimated_delivery: { type: "string", format: "date-time" },
      },
      required: ["supplier", "ordered_by", "estimated_delivery"],
      additionalProperties: false,
    },
  },
  required: ["body"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const GetOrderSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "GetOrder",
  type: "object",
  properties: {
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  required: ["params"],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const WorkflowStepSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "WorkflowStep",
  type: "object",
  properties: {
    step_id: { type: "string" },
    transaction_id: { type: "string" },
    workflow_type: { type: "string" },
    step_name: { type: "string" },
    step_order: { type: "number" },
    is_completed: { type: "boolean" },
    completed_at: { type: ["string", "null"], format: "date-time" },
    completed_by: { type: ["string", "null"] },
    created_by: { type: "string" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
  required: [
    "step_id",
    "transaction_id",
    "workflow_type",
    "step_name",
    "step_order",
    "is_completed",
    "created_by",
    "created_at",
    "updated_at",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const WorkflowStepsArraySchema = {
  $id: "workflowStepsArray.json",
  type: "array",
  items: WorkflowStepSchema,
} as const satisfies JSONSchema;

export const WorkflowProgressSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "WorkflowProgress",
  type: "object",
  properties: {
    total_steps: { type: "number" },
    completed_steps: { type: "number" },
    progress_percentage: { type: "number" },
    current_step: {
      type: ["object", "null"],
      properties: {
        step_id: { type: "string" },
        step_name: { type: "string" },
        step_order: { type: "number" },
        is_completed: { type: "boolean" },
        completed_at: { type: ["string", "null"], format: "date-time" },
      },
      required: ["step_id", "step_name", "step_order", "is_completed"],
      additionalProperties: false,
    },
    is_workflow_complete: { type: "boolean" },
    steps_summary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step_id: { type: "string" },
          step_name: { type: "string" },
          step_order: { type: "number" },
          is_completed: { type: "boolean" },
          completed_at: { type: ["string", "null"], format: "date-time" },
        },
        required: ["step_id", "step_name", "step_order", "is_completed"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "total_steps",
    "completed_steps",
    "progress_percentage",
    "current_step",
    "is_workflow_complete",
    "steps_summary",
  ],
  additionalProperties: false,
} as const satisfies JSONSchema;

export const CreateWorkflowSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "CreateWorkflow",
  type: "object",
  properties: {
    transaction_id: { type: "string", format: "uuid" },
    workflow_type: { type: "string" },
    created_by: { type: "string" },
  },
  required: ["transaction_id", "workflow_type"],
  additionalProperties: false,
} as const satisfies JSONSchema;
