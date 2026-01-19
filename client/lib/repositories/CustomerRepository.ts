import { getDatabase } from '@/lib/database';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from './types';

export class CustomerRepository {
  async findAll(): Promise<Customer[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Customer>(
      'SELECT * FROM customers ORDER BY name ASC'
    );
    return result;
  }

  async findById(id: number): Promise<Customer | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Customer>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    return result || null;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Customer>(
      'SELECT * FROM customers WHERE phone = ?',
      [phone]
    );
    return result || null;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO customers (name, phone, total_owed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [input.name, input.phone || null, input.total_owed || 0, now, now]
    );

    const customer = await this.findById(result.lastInsertRowId);
    if (!customer) {
      throw new Error('Failed to create customer');
    }
    return customer;
  }

  async update(id: number, input: UpdateCustomerInput): Promise<Customer | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: (string | number | null)[] = [now];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      values.push(input.phone);
    }
    if (input.total_owed !== undefined) {
      updates.push('total_owed = ?');
      values.push(input.total_owed);
    }

    values.push(id);

    await db.runAsync(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  async updateBalance(id: number, amount: number): Promise<Customer | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const newBalance = existing.total_owed + amount;

    await db.runAsync(
      'UPDATE customers SET total_owed = ?, updated_at = ? WHERE id = ?',
      [newBalance, now, id]
    );

    return this.findById(id);
  }

  async recalculateBalance(id: number): Promise<Customer | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const result = await db.getFirstAsync<{ balance: number }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE -amount END), 0) as balance
       FROM transactions
       WHERE customer_id = ?`,
      [id]
    );

    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE customers SET total_owed = ?, updated_at = ? WHERE id = ?',
      [result?.balance || 0, now, id]
    );

    return this.findById(id);
  }

  async search(query: string): Promise<Customer[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Customer>(
      `SELECT * FROM customers 
       WHERE name LIKE ? OR phone LIKE ?
       ORDER BY name ASC`,
      [`%${query}%`, `%${query}%`]
    );
    return result;
  }

  async findWithDebt(): Promise<Customer[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Customer>(
      'SELECT * FROM customers WHERE total_owed > 0 ORDER BY total_owed DESC'
    );
    return result;
  }

  async findWithCredit(): Promise<Customer[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Customer>(
      'SELECT * FROM customers WHERE total_owed < 0 ORDER BY total_owed ASC'
    );
    return result;
  }

  async getTotalOwed(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(total_owed), 0) as total FROM customers WHERE total_owed > 0'
    );
    return result?.total || 0;
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM customers'
    );
    return result?.count || 0;
  }
}

export const customerRepository = new CustomerRepository();
