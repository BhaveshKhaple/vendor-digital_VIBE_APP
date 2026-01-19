/**
 * Web-compatible database implementation using localStorage
 * This serves as a fallback when expo-sqlite is not available (web platform)
 */

interface SQLiteResult {
    lastInsertRowId: number;
    changes: number;
}

interface WebDatabase {
    getAllAsync<T>(query: string, params?: unknown[]): Promise<T[]>;
    getFirstAsync<T>(query: string, params?: unknown[]): Promise<T | null>;
    runAsync(query: string, params?: unknown[]): Promise<SQLiteResult>;
    execAsync(query: string): Promise<void>;
    closeAsync(): Promise<void>;
}

type EntityType = 'products' | 'customers' | 'transactions';

interface StorageData {
    products: Record<string, unknown>[];
    customers: Record<string, unknown>[];
    transactions: Record<string, unknown>[];
    counters: {
        products: number;
        customers: number;
        transactions: number;
    };
}

const STORAGE_KEY = 'vendor_ledger_db';

function getStorageData(): StorageData {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Failed to parse storage data:', e);
    }
    return {
        products: [],
        customers: [],
        transactions: [],
        counters: { products: 0, customers: 0, transactions: 0 },
    };
}

function saveStorageData(data: StorageData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save storage data:', e);
    }
}

function parseQuery(query: string): { type: string; table: EntityType; conditions?: string } {
    const normalized = query.trim().toUpperCase();

    if (normalized.startsWith('SELECT')) {
        const fromMatch = query.match(/FROM\s+(\w+)/i);
        const table = fromMatch ? fromMatch[1].toLowerCase() as EntityType : 'products';
        const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+ORDER|\s*$)/i);
        return { type: 'SELECT', table, conditions: whereMatch?.[1] };
    }

    if (normalized.startsWith('INSERT')) {
        const intoMatch = query.match(/INTO\s+(\w+)/i);
        return { type: 'INSERT', table: intoMatch ? intoMatch[1].toLowerCase() as EntityType : 'products' };
    }

    if (normalized.startsWith('UPDATE')) {
        const tableMatch = query.match(/UPDATE\s+(\w+)/i);
        return { type: 'UPDATE', table: tableMatch ? tableMatch[1].toLowerCase() as EntityType : 'products' };
    }

    if (normalized.startsWith('DELETE')) {
        const fromMatch = query.match(/FROM\s+(\w+)/i);
        return { type: 'DELETE', table: fromMatch ? fromMatch[1].toLowerCase() as EntityType : 'products' };
    }

    return { type: 'UNKNOWN', table: 'products' };
}

function extractColumns(query: string): string[] {
    const match = query.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
    if (match) {
        return match[1].split(',').map(col => col.trim());
    }
    return [];
}

class WebDatabaseImpl implements WebDatabase {
    async getAllAsync<T>(query: string, params: unknown[] = []): Promise<T[]> {
        const data = getStorageData();
        const parsed = parseQuery(query);

        let items = [...(data[parsed.table] || [])] as T[];

        // Handle WHERE id = ?
        if (parsed.conditions && params.length > 0) {
            const idMatch = parsed.conditions.match(/id\s*=\s*\?/i);
            if (idMatch) {
                items = items.filter((item: unknown) => (item as Record<string, unknown>).id === params[0]);
            }

            // Handle WHERE name LIKE ?
            const likeMatch = parsed.conditions.match(/name\s+LIKE\s+\?/i);
            if (likeMatch && typeof params[0] === 'string') {
                const searchTerm = params[0].replace(/%/g, '').toLowerCase();
                items = items.filter((item: unknown) =>
                    String((item as Record<string, unknown>).name || '').toLowerCase().includes(searchTerm)
                );
            }
        }

        return items;
    }

    async getFirstAsync<T>(query: string, params: unknown[] = []): Promise<T | null> {
        const normalized = query.trim().toUpperCase();

        // Handle COUNT(*) queries
        if (normalized.includes('COUNT(*)')) {
            const data = getStorageData();
            const parsed = parseQuery(query);
            const count = data[parsed.table]?.length || 0;
            return { count } as T;
        }

        const results = await this.getAllAsync<T>(query, params);
        return results.length > 0 ? results[0] : null;
    }

    async runAsync(query: string, params: unknown[] = []): Promise<SQLiteResult> {
        const data = getStorageData();
        const parsed = parseQuery(query);

        if (parsed.type === 'INSERT') {
            const columns = extractColumns(query);
            const newId = ++data.counters[parsed.table];

            const newItem: Record<string, unknown> = { id: newId };
            columns.forEach((col, idx) => {
                newItem[col] = params[idx];
            });

            data[parsed.table].push(newItem);
            saveStorageData(data);

            return { lastInsertRowId: newId, changes: 1 };
        }

        if (parsed.type === 'UPDATE') {
            const idIndex = params.length - 1;
            const id = params[idIndex];

            const itemIndex = data[parsed.table].findIndex(
                (item) => (item as Record<string, unknown>).id === id
            );

            if (itemIndex !== -1) {
                // Extract SET clause columns
                const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
                if (setMatch) {
                    const setPairs = setMatch[1].split(',').map(p => p.trim());
                    let paramIdx = 0;
                    setPairs.forEach(pair => {
                        const colMatch = pair.match(/(\w+)\s*=\s*\?/);
                        if (colMatch) {
                            (data[parsed.table][itemIndex] as Record<string, unknown>)[colMatch[1]] = params[paramIdx++];
                        }
                    });
                }
                saveStorageData(data);
                return { lastInsertRowId: id as number, changes: 1 };
            }

            return { lastInsertRowId: 0, changes: 0 };
        }

        if (parsed.type === 'DELETE') {
            const id = params[0];
            const initialLength = data[parsed.table].length;
            data[parsed.table] = data[parsed.table].filter(
                (item) => (item as Record<string, unknown>).id !== id
            );
            const changes = initialLength - data[parsed.table].length;
            saveStorageData(data);
            return { lastInsertRowId: 0, changes };
        }

        return { lastInsertRowId: 0, changes: 0 };
    }

    async execAsync(_query: string): Promise<void> {
        // Initialize storage if needed
        const data = getStorageData();
        saveStorageData(data);
    }

    async closeAsync(): Promise<void> {
        // No-op for web
    }
}

let webDb: WebDatabase | null = null;

export async function getWebDatabase(): Promise<WebDatabase> {
    if (!webDb) {
        webDb = new WebDatabaseImpl();
        await webDb.execAsync(''); // Initialize
    }
    return webDb;
}

export async function closeWebDatabase(): Promise<void> {
    if (webDb) {
        await webDb.closeAsync();
        webDb = null;
    }
}

export async function resetWebDatabase(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
}
