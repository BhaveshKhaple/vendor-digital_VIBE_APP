import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { productRepository } from '@/lib/repositories';

const ICON_OPTIONS = [
  { key: 'food', icon: 'coffee' as const, label: 'Food' },
  { key: 'drink', icon: 'droplet' as const, label: 'Drink' },
  { key: 'tool', icon: 'tool' as const, label: 'Tool' },
  { key: 'clothing', icon: 'shopping-bag' as const, label: 'Clothing' },
  { key: 'electronics', icon: 'smartphone' as const, label: 'Electronics' },
  { key: 'service', icon: 'briefcase' as const, label: 'Service' },
  { key: 'misc', icon: 'package' as const, label: 'Misc' },
  { key: 'default', icon: 'box' as const, label: 'Other' },
];

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('default');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !price.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSaving(true);
    try {
      await productRepository.create({
        name: name.trim(),
        default_price: numPrice,
        icon_uri: selectedIcon,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to create product:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [name, price, selectedIcon, navigation]);

  const handleIconSelect = useCallback((iconKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIcon(iconKey);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      keyboardShouldPersistTaps="handled"
      testID="add-product-screen"
    >
      <ThemedText style={styles.label}>Product Name</ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundDefault,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="e.g., Coffee, Bread, Phone Case"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
        autoFocus
        testID="input-product-name"
      />

      <ThemedText style={styles.label}>Default Price</ThemedText>
      <View style={styles.priceInputContainer}>
        <ThemedText style={[styles.currencySymbol, { color: theme.textSecondary }]}>
          $
        </ThemedText>
        <TextInput
          style={[
            styles.priceInput,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="0.00"
          placeholderTextColor={theme.textSecondary}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          testID="input-product-price"
        />
      </View>

      <ThemedText style={styles.label}>Icon</ThemedText>
      <View style={styles.iconGrid}>
        {ICON_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => handleIconSelect(option.key)}
            style={[
              styles.iconOption,
              {
                backgroundColor:
                  selectedIcon === option.key
                    ? theme.primary
                    : theme.backgroundDefault,
                borderColor:
                  selectedIcon === option.key ? theme.primary : theme.border,
              },
            ]}
            testID={`icon-option-${option.key}`}
          >
            <Feather
              name={option.icon}
              size={24}
              color={selectedIcon === option.key ? '#FFFFFF' : theme.text}
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleSave}
        disabled={isSaving || !name.trim() || !price.trim()}
        style={[
          styles.saveButton,
          {
            backgroundColor: theme.primary,
            opacity: isSaving || !name.trim() || !price.trim() ? 0.5 : 1,
          },
        ]}
        testID="button-save-product"
      >
        <ThemedText style={styles.saveButtonText}>
          {isSaving ? 'Saving...' : 'Add Product'}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
