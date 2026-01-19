import React, { useCallback } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Product } from '@/lib/repositories/types';

interface ProductCardProps {
  product: Product;
  onSale: (product: Product) => void;
  isExpenseMode?: boolean;
}

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, onSale, isExpenseMode = false }: ProductCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);

  const activeColor = isExpenseMode ? theme.expense : theme.primary;
  const feedbackColor = isExpenseMode ? theme.expense : theme.income;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handlePress = useCallback(() => {
    'worklet';
    scale.value = withSequence(
      withSpring(0.92, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );

    checkOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 200 })
    );

    checkScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 400 }),
      withTiming(0.5, { duration: 200 })
    );

    runOnJS(triggerHaptic)();
    runOnJS(onSale)(product);
  }, [product, onSale, scale, checkOpacity, checkScale, triggerHaptic]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const formattedPrice = product.default_price.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: isExpenseMode
            ? `${theme.expense}10`
            : theme.backgroundDefault
        },
        animatedCardStyle,
      ]}
      testID={`product-card-${product.id}`}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isExpenseMode
              ? `${theme.expense}20`
              : theme.backgroundSecondary
          }
        ]}
      >
        <Feather
          name={getIconName(product.icon_uri)}
          size={36}
          color={activeColor}
        />
        <Animated.View style={[styles.checkOverlay, animatedCheckStyle]}>
          <View style={[styles.checkCircle, { backgroundColor: feedbackColor }]}>
            <Feather
              name={isExpenseMode ? 'minus' : 'check'}
              size={28}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>
      </View>
      <ThemedText style={styles.productName} numberOfLines={1}>
        {product.name}
      </ThemedText>
      <ThemedText style={[styles.productPrice, { color: activeColor }]}>
        {isExpenseMode ? '-' : ''}₹{formattedPrice}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.xs,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
});
