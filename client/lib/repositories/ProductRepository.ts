import { getDatabase } from '@/lib/database';
import type { Product, CreateProductInput, UpdateProductInput } from './types';

export class ProductRepository {
  async findAll(): Promise<Product[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Product>(
      'SELECT * FROM products ORDER BY name ASC'
    );
    return result;
  }

  async findById(id: number): Promise<Product | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<Product>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return result || null;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      `INSERT INTO products (name, icon_uri, default_price, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [input.name, input.icon_uri || null, input.default_price, now, now]
    );

    const product = await this.findById(result.lastInsertRowId);
    if (!product) {
      throw new Error('Failed to create product');
    }
    return product;
  }

  async update(id: number, input: UpdateProductInput): Promise<Product | null> {
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
    if (input.icon_uri !== undefined) {
      updates.push('icon_uri = ?');
      values.push(input.icon_uri);
    }
    if (input.default_price !== undefined) {
      updates.push('default_price = ?');
      values.push(input.default_price);
    }

    values.push(id);

    await db.runAsync(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  async search(query: string): Promise<Product[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Product>(
      'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC',
      [`%${query}%`]
    );
    return result;
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM products'
    );
    return result?.count || 0;
  }
}

export const productRepository = new ProductRepository();
