import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

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
  setExerciseCategory,
  setUserProfile,
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

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [])
  );

  const addMock = async () => {
    // Your imported workout history (Toji_Project)
    const importedLifts: LiftEntry[] = [
      // Push exercises
      { name: 'Seated Dumbbell Shoulder Press', sets: 2, reps: 10, weight: 12, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: 10, weight: 14, timestamp: new Date('2026-02-03').getTime() },
      { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: 6, weight: 16, timestamp: new Date('2026-02-12').getTime() },
      
      { name: 'Incline Dumbbell Press', sets: 4, reps: 9, weight: 14, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 14, timestamp: new Date('2026-02-03').getTime() },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 7, weight: 16, timestamp: new Date('2026-02-05').getTime() },
      { name: 'Incline Dumbbell Press', sets: 1, reps: 5, weight: 18, timestamp: new Date('2026-02-12').getTime() },
      { name: 'Incline Dumbbell Press', sets: 2, reps: 7, weight: 16, timestamp: new Date('2026-02-12').getTime() + 3600000 },
      
      { name: 'Cable Lateral Raise', sets: 3, reps: 9, weight: 3.4, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Cable Lateral Raise', sets: 4, reps: 10, weight: 4.5, timestamp: new Date('2026-02-03').getTime() },
      { name: 'Cable Lateral Raise', sets: 3, reps: 9, weight: 4.5, timestamp: new Date('2026-02-12').getTime() },
      
      { name: 'Tricep Rope Pushdown', sets: 3, reps: 11, weight: 17, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Tricep Rope Pushdown', sets: 3, reps: 10, weight: 19.3, timestamp: new Date('2026-02-03').getTime() },
      { name: 'Tricep Rope Pushdown', sets: 3, reps: 10, weight: 19.3, timestamp: new Date('2026-02-12').getTime() },
      
      { name: 'Overhead Tricep Extension', sets: 3, reps: 9, weight: 8, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Overhead Tricep Extension', sets: 3, reps: 9, weight: 10.2, timestamp: new Date('2026-02-03').getTime() },
      { name: 'Overhead Tricep Extension', sets: 3, reps: 10, weight: 10.2, timestamp: new Date('2026-02-12').getTime() },
      
      { name: 'Assisted Dips', sets: 2, reps: 6, weight: -14, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Assisted Dips', sets: 2, reps: 5, weight: -14, timestamp: new Date('2026-02-03').getTime() },
      
      // Pull exercises
      { name: 'Lat Pulldown', sets: 3, reps: 8, weight: 39, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Lat Pulldown', sets: 3, reps: 7, weight: 52, timestamp: new Date('2026-02-04').getTime() },
      { name: 'Lat Pulldown', sets: 2, reps: 10, weight: 52, timestamp: new Date('2026-02-08').getTime() },
      { name: 'Lat Pulldown', sets: 1, reps: 10, weight: 45, timestamp: new Date('2026-02-08').getTime() + 3600000 },
      { name: 'Lat Pulldown', sets: 3, reps: 8, weight: 52, timestamp: new Date('2026-02-13').getTime() },
      
      { name: 'Diverging Seated Row', sets: 3, reps: 9, weight: 45, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Diverging Seated Row', sets: 4, reps: 10, weight: 33, timestamp: new Date('2026-02-04').getTime() },
      { name: 'Diverging Seated Row', sets: 3, reps: 9, weight: 36, timestamp: new Date('2026-02-08').getTime() },
      { name: 'Diverging Seated Row', sets: 3, reps: 8, weight: 41, timestamp: new Date('2026-02-13').getTime() },
      
      { name: 'Face Pulls', sets: 3, reps: 15, weight: 17, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Face Pulls', sets: 4, reps: 12, weight: 19.3, timestamp: new Date('2026-02-08').getTime() },
      { name: 'Face Pulls', sets: 3, reps: 10, weight: 23, timestamp: new Date('2026-02-13').getTime() },
      
      { name: 'Single Arm Db Row', sets: 2, reps: 14, weight: 10, timestamp: new Date('2026-02-04').getTime() },
      { name: 'Single Arm Db Row', sets: 3, reps: 10, weight: 14, timestamp: new Date('2026-02-08').getTime() },
      { name: 'Single Arm Db Row', sets: 3, reps: 8, weight: 18, timestamp: new Date('2026-02-13').getTime() },
      
      { name: 'Bicep Curls Incline', sets: 3, reps: 6, weight: 8, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Bicep Curls Incline', sets: 3, reps: 9, weight: 10, timestamp: new Date('2026-02-04').getTime() },
      { name: 'Bicep Curls Incline', sets: 3, reps: 10, weight: 10, timestamp: new Date('2026-02-10').getTime() },
      
      // Leg exercises
      { name: 'Leg Press', sets: 3, reps: 10, weight: 59, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Leg Press', sets: 3, reps: 11, weight: 66, timestamp: new Date('2026-02-02').getTime() },
      { name: 'Leg Press', sets: 3, reps: 10, weight: 73, timestamp: new Date('2026-02-05').getTime() },
      { name: 'Leg Press', sets: 1, reps: 6, weight: 73, timestamp: new Date('2026-02-11').getTime() },
      
      { name: 'Leg Extension', sets: 2, reps: 15, weight: 32, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Leg Extension', sets: 3, reps: 11, weight: 32, timestamp: new Date('2026-02-02').getTime() },
      { name: 'Leg Extension', sets: 3, reps: 12, weight: 39, timestamp: new Date('2026-02-05').getTime() },
      { name: 'Leg Extension', sets: 3, reps: 10, weight: 48.5, timestamp: new Date('2026-02-11').getTime() },
      
      { name: 'Rdl', sets: 1, reps: 10, weight: 32, timestamp: new Date('2026-01-20').getTime() },
      { name: 'Rdl', sets: 3, reps: 8, weight: 40, timestamp: new Date('2026-02-11').getTime() },
    ];

    for (const l of importedLifts) await addLift(l);

    // Add exercise categories
    await setExerciseCategory('Seated Dumbbell Shoulder Press', 'push');
    await setExerciseCategory('Incline Dumbbell Press', 'push');
    await setExerciseCategory('Cable Lateral Raise', 'push');
    await setExerciseCategory('Tricep Rope Pushdown', 'push');
    await setExerciseCategory('Overhead Tricep Extension', 'push');
    await setExerciseCategory('Assisted Dips', 'push');
    
    await setExerciseCategory('Lat Pulldown', 'pull');
    await setExerciseCategory('Diverging Seated Row', 'pull');
    await setExerciseCategory('Face Pulls', 'pull');
    await setExerciseCategory('Single Arm Db Row', 'pull');
    await setExerciseCategory('Bicep Curls Incline', 'pull');
    
    await setExerciseCategory('Leg Press', 'legs');
    await setExerciseCategory('Leg Extension', 'legs');
    await setExerciseCategory('Rdl', 'legs');

    const mockGoal: Goal = { 
      text: 'Build athletic physique like Toji, fix "nerd neck" and back posture, debloat if possible',
      displayText: 'Build an athletic physique with strong posture, correct forward head position, and achieve a lean, defined look',
      timestamp: Date.now() - 604800000 
    };
    await setGoal(mockGoal);

    // Set user profile
    await setUserProfile({
      weightKg: 72,
      heightCm: 188, // 6'2"
      build: 'ectomorph',
      activityLevel: 'active',
    });

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
