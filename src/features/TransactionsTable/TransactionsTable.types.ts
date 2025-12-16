import type { Transaction, Bike, Customer, OrderRequest } from '../../model';

export interface IRow {
  Transaction: Transaction;
  Customer: Customer;
  OrderRequests: Array<OrderRequest>;
  Bike?: Bike;
}
