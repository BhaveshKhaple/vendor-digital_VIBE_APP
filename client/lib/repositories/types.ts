export interface Product {
  id: number;
  name: string;
  icon_uri: string | null;
  default_price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  icon_uri?: string | null;
  default_price: number;
}

export interface UpdateProductInput {
  name?: string;
  icon_uri?: string | null;
  default_price?: number;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: number;
  product_id: number | null;
  customer_id: number | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  timestamp: string;
  created_at: string;
}

export interface CreateTransactionInput {
  product_id?: number | null;
  customer_id?: number | null;
  amount: number;
  type: TransactionType;
  note?: string | null;
  timestamp?: string;
}

export interface UpdateTransactionInput {
  product_id?: number | null;
  customer_id?: number | null;
  amount?: number;
  type?: TransactionType;
  note?: string | null;
  timestamp?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  total_owed: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  total_owed?: number;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  total_owed?: number;
}

export interface TransactionWithProduct extends Transaction {
  product_name?: string | null;
  product_icon?: string | null;
}

export interface TransactionWithCustomer extends Transaction {
  customer_name?: string | null;
}

export interface DailySummary {
  date: string;
  total_in: number;
  total_out: number;
  net: number;
  transaction_count: number;
}
