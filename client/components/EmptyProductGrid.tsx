import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface EmptyProductGridProps {
  onAddProduct: () => void;
}

export function EmptyProductGrid({ onAddProduct }: EmptyProductGridProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="package" size={48} color={theme.primary} />
      </View>
      <ThemedText style={styles.title}>No Products Yet</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Add your products to start quick sales
      </ThemedText>
      <Pressable
        onPress={onAddProduct}
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        testID="add-first-product"
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText style={styles.addButtonText}>Add Product</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
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
});
