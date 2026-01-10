import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import DBModel, {  Part } from "./model";
import { mockItem } from "./test-constants";

beforeEach(() => {
  // Ensure AJV validators are compiled before each test so the model's type guards work
  DBModel.initialize();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DBModel endpoints (customers, transactions, items, processPdf)", () => {
  let resp: Response;

  it("fetchCustomers returns customers when the response is valid", async () => {
    const customers = [
      {
        customer_id: "c1",
        first_name: "Alice",
        last_name: "Smith",
        email: "alice@example.com",
        phone: null,
      },
    ];
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: customers,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const res = await DBModel.fetchCustomers();
    expect(res).toEqual(customers);
  });

  it("fetchCustomers throws on invalid response shape", async () => {
    resp = new Response(JSON.stringify({}), { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);
    await expect(DBModel.fetchCustomers()).rejects.toThrow("Invalid response");
  });

  it("fetchTransaction returns a transaction object on success", async () => {
    const tx = {
      transaction_num: 42,
      transaction_id: "tx-42",
      date_created: new Date().toISOString(),
      customer_id: "c1",
      transaction_type: "inpatient",
      total_cost: 0,
      is_completed: false,
      is_paid: false,
      is_refurb: false,
      is_urgent: false,
      is_beer_bike: false,
      is_employee: false,
      is_reserved: false,
      is_waiting_on_email: false,
      Bike: null,
      Customer: {
        customer_id: "c1",
        first_name: "Alice",
        last_name: "Smith",
        email: "alice@example.com",
        phone: null,
      },
      OrderRequests: [],
    };
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: tx,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const res = await DBModel.fetchTransaction("tx-42");
    expect(res).toEqual(tx);
  });

  it("fetchTransaction throws on invalid response shape", async () => {
    resp = new Response(JSON.stringify({}), { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);
    await expect(DBModel.fetchTransaction("nope")).rejects.toThrow();
  });

  it("deleteTransaction calls DELETE and resolves on success", async () => {
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: {},
        statusCode: 200,
        success: true,
      }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    await expect(
      DBModel.deleteTransaction("tx-delete"),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/transactions/tx-delete"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("updateTransaction PUTs to the correct URL and returns updated transaction", async () => {
    const updatedTx = {
      transaction_num: 100,
      transaction_id: "tx-100",
      date_created: new Date().toISOString(),
      customer_id: "c100",
      transaction_type: "inpatient",
      total_cost: 0,
      is_completed: true,
      is_paid: true,
      is_refurb: false,
      is_urgent: false,
      is_beer_bike: false,
      is_employee: false,
      is_reserved: false,
      is_waiting_on_email: false,
      Bike: null,
      Customer: {
        customer_id: "c100",
        first_name: "Bob",
        last_name: "Jones",
        email: "bob@example.com",
        phone: null,
      },
      OrderRequests: [],
    };
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: updatedTx,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const res = await DBModel.updateTransaction("tx-100", updatedTx);
    expect(res).toEqual(updatedTx);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/transactions/tx-100"),
      expect.objectContaining({ method: "PUT", body: expect.any(String) }),
    );
  });

  it("postTransaction POSTs and returns new transaction", async () => {
    const newTx = {
      transaction_num: 200,
      transaction_id: "tx-200",
      date_created: new Date().toISOString(),
      customer_id: "c200",
      transaction_type: "inpatient",
      total_cost: 0,
      is_completed: false,
      is_paid: false,
      is_refurb: false,
      is_urgent: false,
      is_beer_bike: false,
      is_employee: false,
      is_reserved: false,
      is_waiting_on_email: false,
      Bike: null,
      Customer: {
        customer_id: "c200",
        first_name: "Carol",
        last_name: "Lee",
        email: "carol@example.com",
        phone: null,
      },
      OrderRequests: [],
    };
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: newTx,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const res = await DBModel.postTransaction(newTx );
    expect(res).toEqual(newTx);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/transactions"),
      expect.objectContaining({ method: "POST", body: expect.any(String) }),
    );
  });

  it("fetchItems returns items when valid", async () => {
    const items = [{ item_id: "i1", name: "Part A", features: [] }];
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: items,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const res = await DBModel.fetchItems();
    expect(res).toEqual(items);
  });

  it("createItem POSTS and returns created item", async () => {
    const item: Part = { item_id: "i2", name: "Part B", features: [], upc: "", standard_price: 0, wholesale_cost: 0, stock: 0, minimum_stock: 0, disabled: false, managed: false, condition: "true", specifications: {} };
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: item,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const created = await DBModel.createItem(item);
    expect(created).toEqual(item);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/items"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(item) }),
    );
  });

  it("updateItem PATCHes and returns updated item", async () => {
    const item = {...mockItem,  item_id: "i3", name: "Part C", features: [] } ;
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: item,
        statusCode: 200,
        success: true,
      }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    const res = await DBModel.updateItem(item);
    expect(res).toEqual(item);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`/items/${item.item_id}`),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(item) }),
    );
  });

  it("deleteItem calls DELETE and resolves on success", async () => {
    resp = new Response(JSON.stringify({
        message: "ok",
        responseObject: {},
        statusCode: 200,
        success: true,
      }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);
    // deleteItem returns the server's responseObject (empty object in this fixture)
    await expect(DBModel.deleteItem("i4")).resolves.toEqual({});
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/items/i4"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("processPdf POSTS to orderRequests/process-pdf and returns server result", async () => {
    resp = new Response(JSON.stringify({ result: "processed" }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);
    const res = await DBModel.processPdf(new FormData());
    expect(res).toEqual({ result: "processed" });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/orderRequests/process-pdf"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});
