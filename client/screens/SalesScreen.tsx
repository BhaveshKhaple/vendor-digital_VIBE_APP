import React, { useCallback, useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { ProductCard } from '@/components/ProductCard';
import { QuickAmountKeypad } from '@/components/QuickAmountKeypad';
import { RecentTransactionItem } from '@/components/RecentTransactionItem';
import { TodaySummaryCard } from '@/components/TodaySummaryCard';
import { EmptyProductGrid } from '@/components/EmptyProductGrid';
import { ExpenseModeToggle } from '@/components/ExpenseModeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useSalesData } from '@/hooks/useSalesData';
import { useExpenseMode } from '@/context/ExpenseModeContext';
import { Spacing } from '@/constants/theme';
import type { Product } from '@/lib/repositories/types';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { isExpenseMode } = useExpenseMode();
  const [refreshing, setRefreshing] = useState(false);

  const activeTheme = isExpenseMode
    ? { ...theme, primary: theme.expense, backgroundSecondary: `${theme.expense}15` }
    : theme;

  const {
    products,
    recentTransactions,
    todaySummary,
    isLoading,
    recordSale,
    recordExpense,
    recordManualTransaction,
    refreshData,
  } = useSalesData();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleProductTap = useCallback(
    async (product: Product) => {
      if (isExpenseMode) {
        await recordExpense(product);
      } else {
        await recordSale(product);
      }
    },
    [isExpenseMode, recordSale, recordExpense]
  );

  const handleManualTransaction = useCallback(
    async (amount: number, type: 'IN' | 'OUT') => {
      await recordManualTransaction(amount, type);
    },
    [recordManualTransaction]
  );

  const handleAddProduct = useCallback(() => {
    navigation.navigate('AddProduct');
  }, [navigation]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      const col = index % 3;
      const isLastInRow = col === 2;
      const isFirstInRow = col === 0;

      return (
        <View
          style={[
            styles.productItemWrapper,
            isFirstInRow && styles.productItemFirst,
            isLastInRow && styles.productItemLast,
          ]}
        >
          <ProductCard 
            product={item} 
            onSale={handleProductTap} 
            isExpenseMode={isExpenseMode}
          />
        </View>
      );
    },
    [handleProductTap, isExpenseMode]
  );

  const renderHeader = useCallback(() => (
    <>
      <View style={styles.modeToggleContainer}>
        <ExpenseModeToggle />
      </View>

      <TodaySummaryCard
        totalIn={todaySummary.total_in}
        totalOut={todaySummary.total_out}
      />

      <ThemedText 
        style={[
          styles.sectionTitle,
          isExpenseMode && { color: theme.expense }
        ]}
      >
        {isExpenseMode ? 'Quick Expense' : 'Quick Sale'}
      </ThemedText>

      {products.length > 0 ? (
        <View style={styles.productGrid}>
          {products.slice(0, 9).map((product, index) => (
            <View key={product.id} style={styles.productGridItem}>
              {renderProductItem({ item: product, index })}
            </View>
          ))}
        </View>
      ) : (
        <EmptyProductGrid onAddProduct={handleAddProduct} />
      )}

      <ThemedText 
        style={[
          styles.sectionTitle,
          isExpenseMode && { color: theme.expense }
        ]}
      >
        Quick Amount
      </ThemedText>
      <QuickAmountKeypad 
        onSubmit={handleManualTransaction} 
        isExpenseMode={isExpenseMode}
      />

      {recentTransactions.length > 0 ? (
        <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Recent Activity
        </ThemedText>
      ) : null}
    </>
  ), [
    todaySummary,
    products,
    renderProductItem,
    handleAddProduct,
    handleManualTransaction,
    recentTransactions.length,
    isExpenseMode,
    theme.expense,
  ]);

  const renderTransactionItem = useCallback(
    ({ item }: { item: typeof recentTransactions[0] }) => (
      <RecentTransactionItem transaction={item} />
    ),
    []
  );

  const backgroundColor = isExpenseMode 
    ? `${theme.expense}08` 
    : theme.backgroundRoot;

  return (
    <FlatList
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={recentTransactions}
      renderItem={renderTransactionItem}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={isExpenseMode ? theme.expense : theme.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      testID="sales-screen"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeToggleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  productGridItem: {
    width: '33.33%',
    padding: Spacing.xs,
  },
  productItemWrapper: {
    flex: 1,
  },
  productItemFirst: {
    marginLeft: 0,
  },
  productItemLast: {
    marginRight: 0,
  },
});
