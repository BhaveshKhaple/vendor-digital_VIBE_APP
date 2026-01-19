import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  productRepository,
  transactionRepository,
  type Product,
  type TransactionWithProduct,
  type CreateTransactionInput,
} from '@/lib/repositories';

interface SalesData {
  products: Product[];
  recentTransactions: TransactionWithProduct[];
  todaySummary: { total_in: number; total_out: number; net: number };
  isLoading: boolean;
  error: string | null;
}

interface SalesActions {
  recordSale: (product: Product) => Promise<void>;
  recordExpense: (product: Product) => Promise<void>;
  recordManualTransaction: (amount: number, type: 'IN' | 'OUT') => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useSalesData(): SalesData & SalesActions {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithProduct[]>([]);
  const [todaySummary, setTodaySummary] = useState({ total_in: 0, total_out: 0, net: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [loadedProducts, loadedTransactions, summary] = await Promise.all([
        productRepository.findAll(),
        transactionRepository.findAll(5),
        transactionRepository.getTodaySummary(),
      ]);
      setProducts(loadedProducts);
      setRecentTransactions(loadedTransactions);
      setTodaySummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const recordSale = useCallback(async (product: Product) => {
    try {
      const input: CreateTransactionInput = {
        product_id: product.id,
        amount: product.default_price,
        type: 'IN',
      };
      await transactionRepository.create(input);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale');
    }
  }, [loadData]);

  const recordExpense = useCallback(async (product: Product) => {
    try {
      const input: CreateTransactionInput = {
        product_id: product.id,
        amount: product.default_price,
        type: 'OUT',
        note: `Expense: ${product.name}`,
      };
      await transactionRepository.create(input);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record expense');
    }
  }, [loadData]);

  const recordManualTransaction = useCallback(
    async (amount: number, type: 'IN' | 'OUT') => {
      try {
        const input: CreateTransactionInput = {
          amount,
          type,
          note: 'Manual entry',
        };
        await transactionRepository.create(input);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to record transaction');
      }
    },
    [loadData]
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await loadData();
  }, [loadData]);

  return {
    products,
    recentTransactions,
    todaySummary,
    isLoading,
    error,
    recordSale,
    recordExpense,
    recordManualTransaction,
    refreshData,
  };
}
