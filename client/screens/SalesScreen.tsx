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
import { useTheme } from '@/hooks/useTheme';
import { useSalesData } from '@/hooks/useSalesData';
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
  const [refreshing, setRefreshing] = useState(false);

  const {
    products,
    recentTransactions,
    todaySummary,
    isLoading,
    recordSale,
    recordManualTransaction,
    refreshData,
  } = useSalesData();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleSale = useCallback(
    async (product: Product) => {
      await recordSale(product);
    },
    [recordSale]
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
      const row = Math.floor(index / 3);
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
          <ProductCard product={item} onSale={handleSale} />
        </View>
      );
    },
    [handleSale]
  );

  const renderHeader = useCallback(() => (
    <>
      <TodaySummaryCard
        totalIn={todaySummary.total_in}
        totalOut={todaySummary.total_out}
      />

      <ThemedText style={styles.sectionTitle}>Quick Sale</ThemedText>

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

      <ThemedText style={styles.sectionTitle}>Quick Amount</ThemedText>
      <QuickAmountKeypad onSubmit={handleManualTransaction} />

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
  ]);

  const renderTransactionItem = useCallback(
    ({ item }: { item: typeof recentTransactions[0] }) => (
      <RecentTransactionItem transaction={item} />
    ),
    []
  );

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
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
          tintColor={theme.primary}
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
