import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { productRepository, type Product } from '@/lib/repositories';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PRODUCT_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  food: 'coffee',
  drink: 'droplet',
  tool: 'tool',
  clothing: 'shopping-bag',
  electronics: 'smartphone',
  service: 'briefcase',
  misc: 'package',
  default: 'box',
};

function getIconName(iconUri: string | null): keyof typeof Feather.glyphMap {
  if (!iconUri) return 'box';
  return PRODUCT_ICONS[iconUri] || 'box';
}

function ProductGridItem({
  product,
  onPress,
}: {
  product: Product;
  onPress: (product: Product) => void;
}) {
  const { theme } = useTheme();

  const formatPrice = (value: number) =>
    value.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  return (
    <Pressable
      onPress={() => onPress(product)}
      style={[styles.productCard, { backgroundColor: theme.backgroundDefault }]}
      testID={`inventory-product-${product.id}`}
    >
      <View style={[styles.productIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather
          name={getIconName(product.icon_uri)}
          size={28}
          color={theme.primary}
        />
      </View>
      <ThemedText style={styles.productName} numberOfLines={2}>
        {product.name}
      </ThemedText>
      <ThemedText style={[styles.productPrice, { color: theme.primary }]}>
        ₹{formatPrice(product.default_price)}
      </ThemedText>
    </Pressable>
  );
}

function EmptyInventory({ onAddProduct }: { onAddProduct: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="box" size={48} color={theme.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Products Yet</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Add products to enable quick sales
      </ThemedText>
      <Pressable
        onPress={onAddProduct}
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        testID="add-first-product-inventory"
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText style={styles.addButtonText}>Add Product</ThemedText>
      </Pressable>
    </View>
  );
}

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const loadedProducts = await productRepository.findAll();
      setProducts(loadedProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
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

  const handleAddProduct = useCallback(() => {
    navigation.navigate('AddProduct');
  }, [navigation]);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('EditProduct', { productId: product.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.gridItem}>
        <ProductGridItem product={item} onPress={handleProductPress} />
      </View>
    ),
    [handleProductPress]
  );

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
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          !isLoading ? <EmptyInventory onAddProduct={handleAddProduct} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        testID="inventory-screen"
      />

      {products.length > 0 ? (
        <Pressable
          onPress={handleAddProduct}
          style={[
            styles.fab,
            {
              backgroundColor: theme.primary,
              bottom: tabBarHeight + Spacing.xl,
            },
          ]}
          testID="fab-add-product"
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
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  productCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
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
