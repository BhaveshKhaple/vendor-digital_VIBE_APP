import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Pressable, Linking, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { customerRepository, type Customer } from '@/lib/repositories';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SHOP_NAME = 'My Shop';

function CustomerCard({ 
  customer, 
  onAddCredit,
  onSendReminder,
}: { 
  customer: Customer;
  onAddCredit: (customer: Customer) => void;
  onSendReminder: (customer: Customer) => void;
}) {
  const { theme } = useTheme();
  const hasDebt = customer.total_owed > 0;

  const formatAmount = (value: number) =>
    Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  return (
    <View
      style={[styles.customerCard, { backgroundColor: theme.backgroundDefault }]}
      testID={`customer-card-${customer.id}`}
    >
      <View style={styles.customerRow}>
        <View style={styles.customerInfo}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: hasDebt
                  ? `${theme.expense}20`
                  : `${theme.income}20`,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.avatarText,
                { color: hasDebt ? theme.expense : theme.income },
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
          {hasDebt ? (
            <>
              <ThemedText style={[styles.balanceAmount, { color: theme.expense }]}>
                ${formatAmount(customer.total_owed)}
              </ThemedText>
              <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                owes you
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
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAddCredit(customer);
          }}
          style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
          testID={`add-credit-${customer.id}`}
        >
          <Feather name="plus" size={16} color={theme.primary} />
          <ThemedText style={[styles.actionText, { color: theme.primary }]}>
            Add Credit
          </ThemedText>
        </Pressable>

        {hasDebt && customer.phone ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSendReminder(customer);
            }}
            style={[styles.actionButton, styles.whatsappButton]}
            testID={`whatsapp-${customer.id}`}
          >
            <Feather name="message-circle" size={16} color="#FFFFFF" />
            <ThemedText style={styles.whatsappText}>
              Remind
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EmptyCustomerList({ onAddCustomer }: { onAddCustomer: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Credit Customers</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Add customers who owe you money (Udhaar)
      </ThemedText>
      <Pressable
        onPress={onAddCustomer}
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
        testID="add-first-customer"
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.emptyButtonText}>Add Customer</ThemedText>
      </Pressable>
    </View>
  );
}

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAddCustomer = useCallback(() => {
    navigation.navigate('AddCredit', {});
  }, [navigation]);

  const handleAddCredit = useCallback((customer: Customer) => {
    navigation.navigate('AddCredit', { customer });
  }, [navigation]);

  const handleSendReminder = useCallback(async (customer: Customer) => {
    const message = `Hi ${customer.name}, your balance at ${SHOP_NAME} is $${customer.total_owed.toFixed(2)}.`;
    const phone = customer.phone?.replace(/[^0-9]/g, '');
    
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      console.error('Failed to open WhatsApp:', err);
    }
  }, []);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const renderItem = useCallback(
    ({ item }: { item: Customer }) => (
      <CustomerCard 
        customer={item} 
        onAddCredit={handleAddCredit}
        onSendReminder={handleSendReminder}
      />
    ),
    [handleAddCredit, handleSendReminder]
  );

  const renderHeader = useCallback(() => {
    if (customers.length === 0) return null;

    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
          Total Outstanding (Udhaar)
        </ThemedText>
        <ThemedText style={[styles.summaryAmount, { color: totalOwed > 0 ? theme.expense : theme.income }]}>
          ${formatCurrency(totalOwed)}
        </ThemedText>
      </View>
    );
  }, [totalOwed, customers.length, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={customers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? <EmptyCustomerList onAddCustomer={handleAddCustomer} /> : null}
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

      {customers.length > 0 ? (
        <Pressable
          onPress={handleAddCustomer}
          style={[
            styles.fab,
            { 
              backgroundColor: theme.primary,
              bottom: tabBarHeight + Spacing.xl,
            },
          ]}
          testID="add-customer-fab"
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
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
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  whatsappText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
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
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
