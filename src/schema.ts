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
    features: { type: ["array", "null"] }, // Assuming JSON can be any valid JSON
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
    date_created: { type: "string", nullable: true },
    description: { type: "string" },
  },
  required: ["make", "model", "description"],
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
    bike_id: { type: "string", nullable: true },
    total_cost: { type: "number" },
    description: { type: "string", nullable: true },
    is_completed: { type: "boolean" },
    is_paid: { type: "boolean" },
    is_refurb: { type: "boolean" },
    is_urgent: { type: "boolean" },
    is_nuclear: { type: "boolean", nullable: true },
    is_beer_bike: { type: "boolean" },
    is_employee: { type: "boolean" },
    is_reserved: { type: "boolean" },
    is_waiting_on_email: { type: "boolean" },
    date_completed: { type: "string", nullable: true },
    Bike: {
      type: ["object", "null"],
      nullable: true,
      properties: BikeSchema.properties,
    },
    Customer: {
      type: "object",
      nullable: true,
      properties: CustomerSchema.properties,
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
  additionalProperties: false,
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
  //   oneOf: [
  // {
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

  additionalProperties: true,
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
    quantity_waiting_on_pickup: { type: "number" },
    quantity_waiting_on_safety_check: { type: "number" },
    additionalProperties: false,
  },
  required: [
    "quantity_incomplete",
    "quantity_waiting_on_pickup",
    "quantity_waiting_on_safety_check",
  ],
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
  },
  required: ["user_id", "username", "firstname", "lastname", "active"],
  additionalProperties: false,
} as const satisfies JSONSchema;