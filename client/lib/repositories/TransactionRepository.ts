import { getDatabase } from '@/lib/database';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionWithProduct,
  TransactionType,
  DailySummary,
} from './types';

export class TransactionRepository {
  async findAll(limit?: number): Promise<TransactionWithProduct[]> {
    const db = await getDatabase();
    const query = `
      SELECT t.*, p.name as product_name, p.icon_uri as product_icon
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ORDER BY t.timestamp DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await db.getAllAsync<TransactionWithProduct>(query);
    return result;
  }

  async findById(id: number): Promise<Transaction | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    return result || null;
  }

  async findByIdWithProduct(id: number): Promise<TransactionWithProduct | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<TransactionWithProduct>(
      `SELECT t.*, p.name as product_name, p.icon_uri as product_icon
       FROM transactions t
       LEFT JOIN products p ON t.product_id = p.id
       WHERE t.id = ?`,
      [id]
    );
    return result || null;
  }

  async findByType(type: TransactionType, limit?: number): Promise<TransactionWithProduct[]> {
    const db = await getDatabase();
    const query = `
      SELECT t.*, p.name as product_name, p.icon_uri as product_icon
      FROM transactions t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.type = ?
      ORDER BY t.timestamp DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    const result = await db.getAllAsync<TransactionWithProduct>(query, [type]);
    return result;
  }

  async findByProductId(productId: number): Promise<Transaction[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE product_id = ? ORDER BY timestamp DESC',
      [productId]
    );
    return result;
  }

  async findByCustomerId(customerId: number): Promise<TransactionWithProduct[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<TransactionWithProduct>(
      `SELECT t.*, p.name as product_name, p.icon_uri as product_icon
       FROM transactions t
       LEFT JOIN products p ON t.product_id = p.id
       WHERE t.customer_id = ?
       ORDER BY t.timestamp DESC`,
      [customerId]
    );
    return result;
  }

  async findByDateRange(startDate: string, endDate: string): Promise<TransactionWithProduct[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<TransactionWithProduct>(
      `SELECT t.*, p.name as product_name, p.icon_uri as product_icon
       FROM transactions t
       LEFT JOIN products p ON t.product_id = p.id
       WHERE t.timestamp >= ? AND t.timestamp <= ?
       ORDER BY t.timestamp DESC`,
      [startDate, endDate]
    );
    return result;
  }

  async findToday(): Promise<TransactionWithProduct[]> {
    const db = await getDatabase();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
    
    return this.findByDateRange(startOfDay, endOfDay);
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const timestamp = input.timestamp || now;

    const result = await db.runAsync(
      `INSERT INTO transactions (product_id, customer_id, amount, type, note, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.product_id || null,
        input.customer_id || null,
        input.amount,
        input.type,
        input.note || null,
        timestamp,
        now,
      ]
    );

    const transaction = await this.findById(result.lastInsertRowId);
    if (!transaction) {
      throw new Error('Failed to create transaction');
    }
    return transaction;
  }

  async update(id: number, input: UpdateTransactionInput): Promise<Transaction | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.product_id !== undefined) {
      updates.push('product_id = ?');
      values.push(input.product_id);
    }
    if (input.customer_id !== undefined) {
      updates.push('customer_id = ?');
      values.push(input.customer_id);
    }
    if (input.amount !== undefined) {
      updates.push('amount = ?');
      values.push(input.amount);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      values.push(input.type);
    }
    if (input.note !== undefined) {
      updates.push('note = ?');
      values.push(input.note);
    }
    if (input.timestamp !== undefined) {
      updates.push('timestamp = ?');
      values.push(input.timestamp);
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id);

    await db.runAsync(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'DELETE FROM transactions WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  async getTodaySummary(): Promise<{ total_in: number; total_out: number; net: number }> {
    const db = await getDatabase();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    const result = await db.getFirstAsync<{ total_in: number; total_out: number }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END), 0) as total_out
       FROM transactions
       WHERE timestamp >= ? AND timestamp <= ?`,
      [startOfDay, endOfDay]
    );

    const total_in = result?.total_in || 0;
    const total_out = result?.total_out || 0;
    return { total_in, total_out, net: total_in - total_out };
  }

  async getDailySummaries(days: number = 7): Promise<DailySummary[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<DailySummary>(
      `SELECT 
        date(timestamp) as date,
        COALESCE(SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END), 0) as net,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE timestamp >= date('now', '-${days} days')
       GROUP BY date(timestamp)
       ORDER BY date DESC`
    );
    return result;
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions'
    );
    return result?.count || 0;
  }
}

export const transactionRepository = new TransactionRepository();
