import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useExpenseMode } from '@/context/ExpenseModeContext';
import { Spacing, BorderRadius } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ExpenseModeToggle() {
  const { theme } = useTheme();
  const { isExpenseMode, toggleExpenseMode } = useExpenseMode();

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleExpenseMode();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      isExpenseMode ? 1 : 0,
      [0, 1],
      [theme.backgroundDefault, theme.expense]
    );
    return {
      backgroundColor: withSpring(isExpenseMode ? theme.expense : theme.backgroundDefault, {
        damping: 15,
        stiffness: 200,
      }),
    };
  });

  return (
    <AnimatedPressable
      onPress={handleToggle}
      style={[styles.container, animatedStyle]}
      testID="expense-mode-toggle"
    >
      <Feather
        name={isExpenseMode ? 'trending-down' : 'trending-up'}
        size={18}
        color={isExpenseMode ? '#FFFFFF' : theme.text}
      />
      <ThemedText
        style={[
          styles.label,
          { color: isExpenseMode ? '#FFFFFF' : theme.text },
        ]}
      >
        {isExpenseMode ? 'Expense Mode' : 'Sales Mode'}
      </ThemedText>
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: isExpenseMode
              ? 'rgba(255,255,255,0.3)'
              : theme.backgroundSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.indicatorDot,
            {
              backgroundColor: isExpenseMode ? '#FFFFFF' : theme.income,
              alignSelf: isExpenseMode ? 'flex-end' : 'flex-start',
            },
          ]}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  indicator: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
