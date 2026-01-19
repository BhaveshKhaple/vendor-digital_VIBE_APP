import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { formatCurrencyWithSign } from '@/lib/currency';

interface TodaySummaryCardProps {
  totalIn: number;
  totalOut: number;
}

export function TodaySummaryCard({ totalIn, totalOut }: TodaySummaryCardProps) {
  const { theme } = useTheme();
  const net = totalIn - totalOut;
  const isPositive = net >= 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Today's Balance
        </ThemedText>
        <View
          style={[
            styles.badge,
            { backgroundColor: isPositive ? `${theme.income}20` : `${theme.expense}20` },
          ]}
        >
          <Feather
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={isPositive ? theme.income : theme.expense}
          />
        </View>
      </View>

      <ThemedText
        style={[
          styles.netAmount,
          { color: isPositive ? theme.income : theme.expense },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrencyWithSign(net)}
      </ThemedText>

      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLabel}>
            <View style={[styles.dot, { backgroundColor: theme.income }]} />
            <ThemedText style={[styles.breakdownText, { color: theme.textSecondary }]}>
              Income
            </ThemedText>
          </View>
          <ThemedText style={[styles.breakdownAmount, { color: theme.income }]}>
            {formatCurrencyWithSign(totalIn)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.breakdownItem}>
          <View style={styles.breakdownLabel}>
            <View style={[styles.dot, { backgroundColor: theme.expense }]} />
            <ThemedText style={[styles.breakdownText, { color: theme.textSecondary }]}>
              Expenses
            </ThemedText>
          </View>
          <ThemedText style={[styles.breakdownAmount, { color: theme.expense }]}>
            {formatCurrencyWithSign(-totalOut)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    minWidth: 0,
    flexShrink: 1,
  },
  breakdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  breakdownText: {
    fontSize: 13,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
});
