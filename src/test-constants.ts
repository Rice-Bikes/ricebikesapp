/**
 * Shared test constants for use across test files
 * Constants extracted to avoid React Fast Refresh warnings
 */

import { Part, Customer, Transaction } from "./model";

export const mockUser = {
  user_id: 'test123',
  username: 'test123',
  firstname: 'Test',
  lastname: 'User',
  active: true,
  permissions: [{
    id: 1,
    name: 'admin',
    description: 'Administrator'
  }]
};


export const mockResponse: Response = new Response();
export const mockItem : Part = { item_id: "i2", name: "Part B", features: [], upc: "", standard_price: 0, wholesale_cost: 0, stock: 0, minimum_stock: 0, disabled: false, managed: false, condition: "true", specifications: {} };
export const mockCustomer: Customer = {
  customer_id: "", first_name: "", last_name: "", email: "", phone: ""
}
export const mockTransaction: Transaction = {
  customer_id: "",
  transaction_num: 0,
  transaction_id: "",
  date_created: "",
  transaction_type: "",
  total_cost: 0,
  is_completed: false,
  is_paid: false,
  is_refurb: false,
  is_urgent: false,
  is_beer_bike: false,
  is_employee: false,
  is_reserved: false,
  is_waiting_on_email: false
}