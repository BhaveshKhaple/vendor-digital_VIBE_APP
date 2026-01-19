import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { TransactionWithProduct } from '@/lib/repositories/types';

interface RecentTransactionItemProps {
  transaction: TransactionWithProduct;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function RecentTransactionItem({ transaction }: RecentTransactionItemProps) {
  const { theme } = useTheme();
  const isIncome = transaction.type === 'IN';

  const formattedAmount = transaction.amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      testID={`transaction-item-${transaction.id}`}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isIncome ? `${theme.income}20` : `${theme.expense}20` },
        ]}
      >
        <Feather
          name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
          size={18}
          color={isIncome ? theme.income : theme.expense}
        />
      </View>

      <View style={styles.detailsContainer}>
        <ThemedText style={styles.productName} numberOfLines={1}>
          {transaction.product_name || transaction.note || 'Manual Entry'}
        </ThemedText>
        <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
          {formatTime(transaction.timestamp)}
        </ThemedText>
      </View>

      <ThemedText
        style={[
          styles.amount,
          { color: isIncome ? theme.income : theme.expense },
        ]}
      >
        {isIncome ? '+' : '-'}${formattedAmount}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  detailsContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
