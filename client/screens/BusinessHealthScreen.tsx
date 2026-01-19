import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { transactionRepository } from '@/lib/repositories';
import type { DailySummary } from '@/lib/repositories/types';
import { CURRENCY_SYMBOL } from '@/lib/currency';

export default function BusinessHealthScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await transactionRepository.getDailySummaries(30);
      setSummaries(data);
    } catch (err) {
      console.error('Failed to load health data:', err);
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

  const todayProfit = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySummary = summaries.find(s => s.date === today);
    return todaySummary ? todaySummary.net : 0;
  }, [summaries]);

  const yesterdayProfit = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdaySummary = summaries.find(s => s.date === yesterdayStr);
    return yesterdaySummary ? yesterdaySummary.net : 0;
  }, [summaries]);

  const profitTrend = todayProfit >= yesterdayProfit ? 'up' : 'down';

  const handleBackup = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Mock sync logic as requested for Phase 4
    console.log('Syncing to cloud...');
    setTimeout(() => {
      setLastBackup(new Date());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  }, []);

  const formatCurrency = (amount: number) => {
    return (amount < 0 ? '-' : '') + CURRENCY_SYMBOL + Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return 'Just now';
    return `${minutes} minutes ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        <ThemedView style={styles.card}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Daily Profit</ThemedText>
          <View style={styles.profitRow}>
            <ThemedText style={[styles.profitAmount, { color: todayProfit >= 0 ? theme.income : theme.expense }]}>
              {formatCurrency(todayProfit)}
            </ThemedText>
            <Feather
              name={profitTrend === 'up' ? 'arrow-up-right' : 'arrow-down-right'}
              size={32}
              color={profitTrend === 'up' ? theme.income : theme.expense}
            />
          </View>
          <ThemedText style={[styles.subLabel, { color: theme.textSecondary }]}>
            {profitTrend === 'up' ? 'Better than yesterday' : 'Lower than yesterday'}
          </ThemedText>
        </ThemedView>

        <View style={styles.statsGrid}>
          <ThemedView style={[styles.smallCard, { flex: 1 }]}>
            <ThemedText style={[styles.smallLabel, { color: theme.textSecondary }]}>Today's Sales</ThemedText>
            <ThemedText style={[styles.smallValue, { color: theme.income }]}>
              {formatCurrency(summaries.find(s => s.date === new Date().toISOString().split('T')[0])?.total_in || 0)}
            </ThemedText>
          </ThemedView>
          <ThemedView style={[styles.smallCard, { flex: 1 }]}>
            <ThemedText style={[styles.smallLabel, { color: theme.textSecondary }]}>Today's Expenses</ThemedText>
            <ThemedText style={[styles.smallValue, { color: theme.expense }]}>
              {formatCurrency(summaries.find(s => s.date === new Date().toISOString().split('T')[0])?.total_out || 0)}
            </ThemedText>
          </ThemedView>
        </View>

        <ThemedView style={[styles.card, styles.backupCard]}>
          <View style={styles.backupHeader}>
            <Feather name="cloud-off" size={24} color={theme.textSecondary} />
            <View style={styles.backupInfo}>
              <ThemedText style={styles.backupTitle}>Data Safety</ThemedText>
              <ThemedText style={[styles.backupStatus, { color: theme.textSecondary }]}>
                {lastBackup ? `Last Backed Up: ${getTimeAgo(lastBackup)}` : 'Not backed up yet'}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={handleBackup}
            style={({ pressed }) => [
              styles.backupButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
            <ThemedText style={styles.backupButtonText}>Backup Now</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  profitAmount: {
    fontSize: 42,
    fontWeight: '800',
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  smallCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  smallValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  backupCard: {
    marginTop: Spacing.sm,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backupInfo: {
    flex: 1,
  },
  backupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  backupStatus: {
    fontSize: 13,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  backupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
