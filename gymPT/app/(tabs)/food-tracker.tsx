import { StyleSheet, ScrollView, Pressable, View } from 'react-native';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LineChart from '@/components/linechart';
import { addFoodEntry, getFoodLog, getNutritionTargets, type FoodEntry, type NutritionTargets } from '@/utils/chat-log';

type MetricKey = 'protein' | 'calories' | 'fat' | 'fiber';

export default function FoodTrackerScreen() {
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [selected, setSelected] = useState<MetricKey[]>(['protein']);

  const loadFoodLog = useCallback(async () => {
    const data = await getFoodLog();
    const tgt = await getNutritionTargets();
    console.log('[FoodTracker] Loaded food log:', data.length, 'entries');
    console.log('[FoodTracker] Loaded targets:', tgt);
    setFoodLog(data);
    setTargets(tgt);
  }, []);

  useEffect(() => {
    loadFoodLog();
  }, [loadFoodLog]);

  useFocusEffect(
    useCallback(() => {
      console.log('[FoodTracker] Tab focused, refreshing food log');
      loadFoodLog();
      return () => {};
    }, [loadFoodLog])
  );

  const insertMockData = async () => {
    try {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const mock = [
        { name: 'Chicken bowl', calories: 650, proteinGrams: 45, carbsGrams: 60, fatsGrams: 15, fiberGrams: 6, timestamp: now - day * 1 },
        { name: 'Greek yogurt', calories: 180, proteinGrams: 20, carbsGrams: 12, fatsGrams: 4, fiberGrams: 0, timestamp: now - day * 2 },
        { name: 'Salmon plate', calories: 700, proteinGrams: 50, carbsGrams: 45, fatsGrams: 25, fiberGrams: 5, timestamp: now - day * 3 },
        { name: 'Oats & berries', calories: 420, proteinGrams: 18, carbsGrams: 62, fatsGrams: 8, fiberGrams: 9, timestamp: now - day * 4 },
        { name: 'Turkey wrap', calories: 520, proteinGrams: 35, carbsGrams: 50, fatsGrams: 12, fiberGrams: 7, timestamp: now - day * 5 },
        { name: 'Protein shake', calories: 260, proteinGrams: 30, carbsGrams: 10, fatsGrams: 5, fiberGrams: 2, timestamp: now - day * 6 },
        { name: 'Eggs & toast', calories: 360, proteinGrams: 22, carbsGrams: 30, fatsGrams: 14, fiberGrams: 4, timestamp: now - day * 7 },
      ];

      console.log('[insertMockData] Starting insert of', mock.length, 'items');
      for (const m of mock) {
        await addFoodEntry(m);
      }
      console.log('[insertMockData] All entries added');
      const updated = await getFoodLog();
      console.log('[insertMockData] Retrieved updated log:', updated.length, 'entries');
      if (updated.length > 0) {
        console.log('[insertMockData] First entry:', updated[0]);
        console.log('[insertMockData] Last entry:', updated[updated.length - 1]);
      }
      setFoodLog(updated);
    } catch (err) {
      console.error('[insertMockData] Error:', err);
    }
  };

  const last14Days = useMemo(() => {
    const today = new Date();
    const result: { date: string; protein: number; calories: number; fat: number; fiber: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = foodLog.filter((e) => new Date(e.timestamp).toISOString().slice(0, 10) === dateStr);
      const totals = dayEntries.reduce(
        (acc, e) => ({
          protein: acc.protein + (e.proteinGrams ?? 0),
          calories: acc.calories + e.calories,
          fat: acc.fat + (e.fatsGrams ?? 0),
          fiber: acc.fiber + (e.fiberGrams ?? 0),
        }),
        { protein: 0, calories: 0, fat: 0, fiber: 0 }
      );
      result.push({ date: dateStr, ...totals });
    }
    return result;
  }, [foodLog]);

  const metricSeries = (key: MetricKey) => last14Days.map((d) => d[key]);

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        return prev.length === 1 ? prev : prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Food Tracker</ThemedText>
      <ThemedText>Graphs by day (last 14 days)</ThemedText>

      <View style={styles.toggleRow}>
        {(
          [
            { key: 'protein', label: 'Protein' },
            { key: 'calories', label: 'Calories' },
            { key: 'fat', label: 'Fat' },
            { key: 'fiber', label: 'Fibre' },
          ] as const
        ).map((m) => (
          <Pressable
            key={m.key}
            onPress={() => toggleMetric(m.key)}
            style={[styles.toggleChip, selected.includes(m.key) && styles.toggleChipActive]}
          >
            <ThemedText>{m.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.mockButton} onPress={insertMockData}>
        <ThemedText>Insert Mock Food Data</ThemedText>
      </Pressable>

      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 80 }}>
        {selected.map((key) => {
          // Calculate reasonable max values for each metric
          const metricMax: Record<MetricKey, number> = {
            protein: 200,
            calories: 3000,
            fat: 100,
            fiber: 50,
          };
          
          // Get target for this metric
          const targetMap: Record<MetricKey, keyof NutritionTargets> = {
            protein: 'protein',
            calories: 'calories',
            fat: 'fats',
            fiber: 'fiber',
          };
          const targetValue = targets ? targets[targetMap[key]] : undefined;
          
          return (
            <ThemedView key={key} style={styles.card}>
              <ThemedText type="subtitle">
                {key === 'protein' && 'Protein (g)'}
                {key === 'calories' && 'Calories'}
                {key === 'fat' && 'Fat (g)'}
                {key === 'fiber' && 'Fibre (g)'}
              </ThemedText>
              <LineChart 
                values={metricSeries(key)} 
                height={140} 
                maxValue={metricMax[key]}
                targetValue={targetValue}
                targetColor="#FFD700"
              />
              <ThemedText>
                Latest: {last14Days[last14Days.length - 1]?.[key] ?? 0}
                {key === 'protein' && ' g'}
                {key === 'calories' && ' cal'}
                {key === 'fat' && ' g'}
                {key === 'fiber' && ' g'}
                {targetValue && ` (Target: ${targetValue})`}
              </ThemedText>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(142,142,147,0.12)',
  },
  toggleChipActive: {
    backgroundColor: 'rgba(47,128,237,0.2)',
  },
  card: {
    padding: 16,
    borderRadius: 14,
    gap: 8,
    backgroundColor: 'rgba(142,142,147,0.1)',
  },
  mockButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(47,128,237,0.15)',
  },
});
