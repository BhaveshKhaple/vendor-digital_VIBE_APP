import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { customerRepository, type Customer } from '@/lib/repositories';

function CustomerCard({ customer }: { customer: Customer }) {
  const { theme } = useTheme();
  const hasDebt = customer.total_owed > 0;
  const hasCredit = customer.total_owed < 0;

  const formatAmount = (value: number) =>
    Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  return (
    <Pressable
      style={[styles.customerCard, { backgroundColor: theme.backgroundDefault }]}
      testID={`customer-card-${customer.id}`}
    >
      <View style={styles.customerInfo}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: hasDebt
                ? `${theme.expense}20`
                : hasCredit
                ? `${theme.income}20`
                : theme.backgroundSecondary,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.avatarText,
              {
                color: hasDebt
                  ? theme.expense
                  : hasCredit
                  ? theme.income
                  : theme.text,
              },
            ]}
          >
            {customer.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.customerDetails}>
          <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
          {customer.phone ? (
            <ThemedText style={[styles.customerPhone, { color: theme.textSecondary }]}>
              {customer.phone}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <View style={styles.balanceContainer}>
        {customer.total_owed !== 0 ? (
          <>
            <ThemedText
              style={[
                styles.balanceAmount,
                { color: hasDebt ? theme.expense : theme.income },
              ]}
            >
              {hasDebt ? '-' : '+'}${formatAmount(customer.total_owed)}
            </ThemedText>
            <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
              {hasDebt ? 'owes you' : 'credit'}
            </ThemedText>
          </>
        ) : (
          <View style={[styles.clearedBadge, { backgroundColor: `${theme.income}20` }]}>
            <Feather name="check" size={14} color={theme.income} />
            <ThemedText style={[styles.clearedText, { color: theme.income }]}>
              Settled
            </ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function EmptyCustomerList() {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Customers Yet</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Add customers to track credit and payments
      </ThemedText>
    </View>
  );
}

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalOwed, setTotalOwed] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [loadedCustomers, total] = await Promise.all([
        customerRepository.findAll(),
        customerRepository.getTotalOwed(),
      ]);
      setCustomers(loadedCustomers);
      setTotalOwed(total);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const renderItem = useCallback(
    ({ item }: { item: Customer }) => <CustomerCard customer={item} />,
    []
  );

  const renderHeader = useCallback(() => {
    if (totalOwed === 0) return null;

    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
          Total Outstanding
        </ThemedText>
        <ThemedText style={[styles.summaryAmount, { color: theme.expense }]}>
          ${formatCurrency(totalOwed)}
        </ThemedText>
      </View>
    );
  }, [totalOwed, theme]);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={customers}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={!isLoading ? EmptyCustomerList : null}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      testID="ledger-screen"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceLabel: {
    fontSize: 12,
  },
  clearedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  clearedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
