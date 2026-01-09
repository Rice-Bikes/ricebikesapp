import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DBModel from "./model";

describe("DBModel validators and fetchTransactions", () => {
  beforeEach(() => {
    // Ensure validators are compiled before each test
    DBModel.initialize();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validateTransaction returns true for a valid transaction and false for invalid", () => {
    const validTransaction = {
      transaction_num: 1,
      transaction_id: "tx-1",
      date_created: new Date().toISOString(),
      customer_id: "cust-1",
      transaction_type: "inpatient",
      total_cost: 0,
      description: null,
      is_completed: false,
      is_paid: false,
      is_refurb: false,
      is_urgent: false,
      is_nuclear: null,
      is_beer_bike: false,
      is_employee: false,
      is_reserved: false,
      is_waiting_on_email: false,
      date_completed: null,
      Bike: null,
      Customer: {
        customer_id: "cust-1",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        phone: null,
      },
      OrderRequests: [],
    } as unknown;

    expect(DBModel.validateTransaction(validTransaction)).toBe(true);
    expect(DBModel.validateTransaction({})).toBe(false);
  });

  it("validateArrayResponse returns true for valid array response and false for invalid", () => {
    const validArrayResponse = {
      message: "OK",
      responseObject: [],
      statusCode: 200,
      success: true,
    };
    expect(DBModel.validateArrayResponse(validArrayResponse)).toBe(true);
    expect(DBModel.validateArrayResponse({})).toBe(false);
  });

  it("fetchTransactions throws when the response is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ notAValidResponse: true }),
    } as unknown as Response);

    await expect(DBModel.fetchTransactions(10, false)).rejects.toThrow(
      "Invalid transactions response",
    );
  });

  it("fetchTransactions throws when the response has success=false", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        message: "failed",
        responseObject: [],
        statusCode: 200,
        success: false,
      }),
    } as unknown as Response);

    await expect(DBModel.fetchTransactions(10, false)).rejects.toThrow(
      "Failed to load transactions",
    );
  });

  it("fetchTransactions returns mapped rows for a valid response", async () => {
    const date = new Date().toISOString();
    const tx = {
      transaction_num: 1,
      transaction_id: "tx-1",
      date_created: date,
      customer_id: "cust-1",
      transaction_type: "inpatient",
      total_cost: 0,
      description: null,
      is_completed: false,
      is_paid: false,
      is_refurb: false,
      is_urgent: false,
      is_nuclear: null,
      is_beer_bike: false,
      is_employee: false,
      is_reserved: false,
      is_waiting_on_email: false,
      date_completed: null,
      Bike: null,
      Customer: {
        customer_id: "cust-1",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        phone: null,
      },
      OrderRequests: [],
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        message: "ok",
        responseObject: [tx],
        statusCode: 200,
        success: true,
      }),
    } as unknown as Response);

    const rows = await DBModel.fetchTransactions(50, false);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(1);
    const row = rows[0] as unknown as {
      Transaction: { transaction_id: string };
      Customer: { email: string } | null;
      Bike: unknown;
      OrderRequests: unknown[];
      Submitted: Date;
    };
    expect(row.Transaction.transaction_id).toBe("tx-1");
    expect(row.Customer).toMatchObject({ email: "jane@example.com" });
    expect(row.Bike).toBeNull();
    expect(row.OrderRequests).toEqual([]);
    // Submitted should be a Date equal to the transaction's date_created
    expect(row.Submitted).toBeInstanceOf(Date);
    expect(row.Submitted.toISOString()).toBe(new Date(date).toISOString());
  });

  it("fetchTransactions maps bike string numbers to numbers and returns rows", async () => {
    const txWithStringNumbers = {
      transaction_num: 2,
      transaction_id: "tx-2",
      date_created: "1609459200000",
      customer_id: "cust-2",
      transaction_type: "inpatient",
      total_cost: 0,
      description: null,
      is_completed: false,
      is_paid: false,
      is_refurb: false,
      is_urgent: false,
      is_nuclear: null,
      is_beer_bike: false,
      is_employee: false,
      is_reserved: false,
      is_waiting_on_email: false,
      date_completed: null,
      Bike: {
        bike_id: "b1",
        make: "Brand",
        model: "Model",
        description: "desc",
        size_cm: "54",
        price: "299.99",
        deposit_amount: "50",
      },
      Customer: {
        customer_id: "c2",
        first_name: "Jake",
        last_name: "Smith",
        email: "jake@example.com",
        phone: "555",
      },
      OrderRequests: [],
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        message: "ok",
        responseObject: [txWithStringNumbers],
        statusCode: 200,
        success: true,
      }),
    } as unknown as Response);
    const validateBikeSpy = vi.spyOn(DBModel, "validateBike");

    const rows = await DBModel.fetchTransactions(10, false);
    expect(rows).toHaveLength(1);
    const bike = rows[0].Bike as Record<string, unknown>;

    // The validators perform coercion for validation. Ensure validateBike was invoked
    // with the converted numeric values (strings -> numbers) for validation.
    expect(validateBikeSpy).toHaveBeenCalled();
    const calledArg = (validateBikeSpy.mock.calls[0]?.[0] ?? {}) as {
      size_cm?: number | string;
      price?: number | string;
      deposit_amount?: number | string;
    };
    expect(typeof calledArg.size_cm).toBe("number");
    expect(typeof calledArg.price).toBe("number");
    expect(typeof calledArg.deposit_amount).toBe("number");

    // The returned bike object in the rows preserves the original response values (strings).
    expect(typeof bike.size_cm).toBe("string");
    expect(typeof bike.price).toBe("string");
    expect(typeof bike.deposit_amount).toBe("string");
  });

  it("fetchTransactions throws when customer invalid", async () => {
    const txInvalidCustomer = {
      transaction_id: "tx-3",
      transaction_num: 3,
      date_created: "1609459200000",
      Bike: null,
      Customer: {},
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        message: "ok",
        responseObject: [txInvalidCustomer],
        statusCode: 200,
        success: true,
      }),
    } as unknown as Response);

    await expect(DBModel.fetchTransactions(1, true)).rejects.toThrow(
      "Invalid customer found",
    );
  });

  it("fetchTransactions throws when bike invalid", async () => {
    const txInvalidBike = {
      transaction_id: "tx-4",
      transaction_num: 4,
      date_created: "1609459200000",
      Bike: { size_cm: "54" },
      Customer: {
        customer_id: "c4",
        first_name: "Mina",
        last_name: "Lee",
        email: "mina@example.com",
        phone: "555",
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({
        message: "ok",
        responseObject: [txInvalidBike],
        statusCode: 200,
        success: true,
      }),
    } as unknown as Response);

    await expect(DBModel.fetchTransactions(1, true)).rejects.toThrow(
      "Invalid bike found",
    );
  });

  it("getTransactionsQuery and getTransactionQuery return query options with expected keys", () => {
    const txQuery = DBModel.getTransactionsQuery(20, true) as {
      queryKey: (string | number)[];
    };
    expect(txQuery).toHaveProperty("queryKey");
    expect(txQuery.queryKey).toEqual(["transactions"]);

    const singleQuery = DBModel.getTransactionQuery("tx-42") as {
      queryKey: (string | number)[];
    };
    expect(singleQuery).toHaveProperty("queryKey");
    expect(singleQuery.queryKey).toEqual(["transaction", "tx-42"]);
  });
});
