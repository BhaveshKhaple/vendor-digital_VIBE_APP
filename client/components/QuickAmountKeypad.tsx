import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface QuickAmountKeypadProps {
  onSubmit: (amount: number, type: 'IN' | 'OUT') => void;
  isExpenseMode?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function KeypadButton({
  value,
  onPress,
  isExpenseMode = false,
}: {
  value: string;
  onPress: (value: string) => void;
  isExpenseMode?: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(value);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDelete = value === 'del';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.keyButton,
        { 
          backgroundColor: isExpenseMode 
            ? `${theme.expense}10` 
            : theme.backgroundDefault 
        },
        animatedStyle,
      ]}
      testID={`keypad-${value}`}
    >
      {isDelete ? (
        <Feather name="delete" size={24} color={theme.text} />
      ) : (
        <ThemedText style={styles.keyText}>{value}</ThemedText>
      )}
    </AnimatedPressable>
  );
}

export function QuickAmountKeypad({ onSubmit, isExpenseMode = false }: QuickAmountKeypadProps) {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('0');

  const handleKeyPress = useCallback((key: string) => {
    if (key === 'del') {
      setAmount((prev) => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
    } else if (key === '.') {
      setAmount((prev) => {
        if (prev.includes('.')) return prev;
        return prev + '.';
      });
    } else {
      setAmount((prev) => {
        if (prev === '0') return key;
        if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
        return prev + key;
      });
    }
  }, []);

  const handleSubmit = useCallback(
    (type: 'IN' | 'OUT') => {
      const numAmount = parseFloat(amount);
      if (numAmount > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubmit(numAmount, type);
        setAmount('0');
      }
    },
    [amount, onSubmit]
  );

  const formattedAmount = parseFloat(amount || '0').toLocaleString('en-US', {
    minimumFractionDigits: amount.includes('.') ? amount.split('.')[1]?.length || 0 : 0,
    maximumFractionDigits: 2,
  });

  const containerBg = isExpenseMode 
    ? `${theme.expense}15` 
    : theme.backgroundSecondary;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={styles.displayContainer}>
        <ThemedText 
          style={[
            styles.currencySymbol, 
            { color: isExpenseMode ? theme.expense : theme.textSecondary }
          ]}
        >
          {isExpenseMode ? '-$' : '$'}
        </ThemedText>
        <ThemedText 
          style={[
            styles.amountDisplay,
            isExpenseMode && { color: theme.expense }
          ]}
        >
          {formattedAmount}
        </ThemedText>
      </View>

      <View style={styles.keypadGrid}>
        {KEYS.map((key) => (
          <KeypadButton 
            key={key} 
            value={key} 
            onPress={handleKeyPress} 
            isExpenseMode={isExpenseMode}
          />
        ))}
      </View>

      <View style={styles.actionButtons}>
        {isExpenseMode ? (
          <Pressable
            onPress={() => handleSubmit('OUT')}
            style={[styles.actionButton, styles.fullWidthButton, { backgroundColor: theme.expense }]}
            testID="keypad-out"
          >
            <Feather name="minus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Record Expense</ThemedText>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => handleSubmit('OUT')}
              style={[styles.actionButton, { backgroundColor: theme.expense }]}
              testID="keypad-out"
            >
              <Feather name="minus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Expense</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleSubmit('IN')}
              style={[styles.actionButton, { backgroundColor: theme.income }]}
              testID="keypad-in"
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Income</ThemedText>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: '700',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: '31%',
    aspectRatio: 1.8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  fullWidthButton: {
    flex: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
