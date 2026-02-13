import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getHistory,
  getLifts,
  getFoodLog,
  getGoal,
  addLift,
  setGoal,
  addFoodEntry,
  clearHistory,
  clearLifts,
  clearFoodLog,
  clearGoal,
  ChatMessage,
  LiftEntry,
  FoodEntry,
  Goal,
} from '@/utils/chat-log';

export default function StorageScreen() {
  const [dump, setDump] = useState('loading...');

  const load = async () => {
    const [history, lifts, food, goal] = await Promise.all([
      getHistory(),
      getLifts(),
      getFoodLog(),
      getGoal(),
    ]);

    const out = {
      history,
      lifts,
      food,
      goal,
    };
    setDump(JSON.stringify(out, null, 2));
  };

  useEffect(() => {
    load();
  }, []);

  const addMock = async () => {
    // mock lifts
    const mockLifts: LiftEntry[] = [
      { name: 'Bench Press', sets: 4, reps: 6, weight: 100, timestamp: Date.now() - 86400000 },
      { name: 'Squat', sets: 5, reps: 5, weight: 140, timestamp: Date.now() - 172800000 },
      { name: 'Deadlift', sets: 3, reps: 5, weight: 180, timestamp: Date.now() - 259200000 },
    ];

    for (const l of mockLifts) await addLift(l);

    const mockGoal: Goal = { text: 'Increase bench to 120kg', timestamp: Date.now() - 604800000 };
    await setGoal(mockGoal);

    const mockFood: FoodEntry[] = [
      { name: 'Breakfast', calories: 550, proteinGrams: 30, carbsGrams: 60, fatsGrams: 15, timestamp: Date.now() - 3600000 },
      { name: 'Lunch', calories: 700, proteinGrams: 45, carbsGrams: 80, fatsGrams: 20, timestamp: Date.now() - 1800000 },
    ];
    for (const f of mockFood) await addFoodEntry(f);

    await load();
  };

  const clearAll = async () => {
    await Promise.all([clearHistory(), clearLifts(), clearFoodLog(), clearGoal()]);
    await load();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.row}>
        <Pressable style={styles.button} onPress={addMock}>
          <ThemedText>Insert mock data</ThemedText>
        </Pressable>
        <Pressable style={styles.button} onPress={clearAll}>
          <ThemedText>Clear storage</ThemedText>
        </Pressable>
        <Pressable style={styles.button} onPress={load}>
          <ThemedText>Refresh</ThemedText>
        </Pressable>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText>
          {dump}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  content: { padding: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  button: { padding: 10, borderRadius: 8, backgroundColor: 'rgba(142,142,147,0.12)' },
});
