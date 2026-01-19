import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { customerRepository, transactionRepository } from '@/lib/repositories';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddCreditRouteProp = RouteProp<RootStackParamList, 'AddCredit'>;

export default function AddCreditScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddCreditRouteProp>();
  const existingCustomer = route.params?.customer;

  const [name, setName] = useState(existingCustomer?.name || '');
  const [phone, setPhone] = useState(existingCustomer?.phone || '');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    setIsLoading(true);
    try {
      let customerId: number;

      if (!existingCustomer) {
        const newCustomer = await customerRepository.create({
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
        customerId = newCustomer.id;
      } else {
        customerId = existingCustomer.id;
      }

      await transactionRepository.create({
        customer_id: customerId,
        amount: numAmount,
        type: 'OUT',
        note: `Credit to \${name.trim()}`,
      });

      await customerRepository.updateBalance(customerId, numAmount);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to add credit:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [name, phone, amount, existingCustomer, navigation]);

  const isValid = name.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inputGroup, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.inputRow}>
            <Feather name="user" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Customer Name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!existingCustomer}
              testID="credit-name-input"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.inputRow}>
            <Feather name="phone" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Phone Number (optional)"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!existingCustomer}
              testID="credit-phone-input"
            />
          </View>
        </View>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Credit Amount
        </ThemedText>

        <View style={[styles.amountContainer, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.currencySymbol, { color: theme.textSecondary }]}>
            ₹
          </ThemedText>
          <TextInput
            style={[styles.amountInput, { color: theme.expense }]}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            value={amount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              if (parts.length > 2) return;
              if (parts[1]?.length > 2) return;
              setAmount(cleaned);
            }}
            keyboardType="decimal-pad"
            testID="credit-amount-input"
          />
        </View>

        <ThemedText style={[styles.helpText, { color: theme.textSecondary }]}>
          This amount will be added to the customer's outstanding balance
        </ThemedText>

        <Pressable
          onPress={handleSave}
          disabled={!isValid || isLoading}
          style={[
            styles.saveButton,
            {
              backgroundColor: isValid ? theme.expense : theme.backgroundSecondary,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          testID="save-credit-button"
        >
          <Feather name="plus" size={20} color={isValid ? '#FFFFFF' : theme.textSecondary} />
          <ThemedText
            style={[
              styles.saveButtonText,
              { color: isValid ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            {existingCustomer ? 'Add Credit' : 'Add Customer & Credit'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  inputGroup: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
