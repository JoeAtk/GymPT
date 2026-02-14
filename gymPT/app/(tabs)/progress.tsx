import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LineChart from '@/components/linechart';
import { getLifts, setExerciseCategory, ExerciseCategory } from '@/utils/chat-log';
import { getExerciseSeries, getRelativeSeries } from '@/utils/progress';
import { classifyLift, categorizeExerciseWithAI } from '@/utils/rag';

export default function ProgressScreen() {
  const [selectedSplit, setSelectedSplit] = useState<'push' | 'pull' | 'legs'>('push');
  const [lifts, setLifts] = useState<any[]>([]);
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, string[]>>({});
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categorizingExercises, setCategorizingExercises] = useState<string[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setIsLoading(true);
    const data = await getLifts();
    setLifts(data);

    // Get unique exercise names
    const uniqueExercises = Array.from(new Set(data.map(l => l.name)));
    
    // Categorize each exercise
    const categorized: Record<string, string[]> = {
      push: [],
      pull: [],
      legs: [],
      unknown: []
    };

    const uncategorized: string[] = [];

    for (const exercise of uniqueExercises) {
      const category = await classifyLift(exercise);
      const cat = category === 'leg' ? 'legs' : category === 'unknown' ? 'unknown' : category;
      
      if (cat === 'unknown') {
        uncategorized.push(exercise);
      }
      
      categorized[cat].push(exercise);
    }

    setExercisesByCategory(categorized);
    setIsLoading(false);

    // Categorize unknown exercises with AI
    if (uncategorized.length > 0) {
      setCategorizingExercises(uncategorized);
      categorizeUnknownExercises(uncategorized);
    }
  };

  const categorizeUnknownExercises = async (exercises: string[]) => {
    const apiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
    if (!apiKey) return;

    for (const exercise of exercises) {
      const category = await categorizeExerciseWithAI(exercise, apiKey);
      
      if (category !== 'unknown') {
        await setExerciseCategory(exercise, category);
        
        // Update state
        setExercisesByCategory(prev => {
          const updated = { ...prev };
          updated.unknown = updated.unknown.filter(e => e !== exercise);
          updated[category] = [...(updated[category] || []), exercise];
          return updated;
        });
      }
      
      setCategorizingExercises(prev => prev.filter(e => e !== exercise));
    }
  };

  const seriesMap = useMemo(() => getExerciseSeries(lifts), [lifts]);

  const currentExercises = exercisesByCategory[selectedSplit] || [];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Progress</ThemedText>

      <View style={styles.splitRow}>
        {(['push', 'pull', 'legs'] as const).map((s) => (
          <TouchableOpacity 
            key={s} 
            onPress={() => setSelectedSplit(s)} 
            style={[styles.splitButton, selectedSplit === s && styles.splitActive]}
          >
            <ThemedText type="subtitle">{s.charAt(0).toUpperCase() + s.slice(1)}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 12 }}>Loading exercises...</ThemedText>
        </View>
      ) : currentExercises.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>
            No {selectedSplit} exercises logged yet.
            {categorizingExercises.length > 0 && '\n\nCategorizing exercises with AI...'}
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={{ gap: 12, paddingBottom: 120 }}>
          {currentExercises.map((ex) => {
            const series = seriesMap[ex] ?? [];
            const rel = getRelativeSeries(series);
            const values = rel.map((r) => r.pct);
            const latest = rel.length ? rel[rel.length - 1] : null;
            const isCategorizing = categorizingExercises.includes(ex);
            
            return (
              <TouchableOpacity key={ex} style={styles.row} onPress={() => setSelectedExercise(ex)}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText type="subtitle">{ex}</ThemedText>
                    {isCategorizing && <ActivityIndicator size="small" />}
                  </View>
                  {latest && (
                    <>
                      <ThemedText>Latest: {latest.pct}% ({latest.est1RM}kg est. 1RM)</ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                        {series.length} sessions • {new Date(latest.timestamp).toLocaleDateString()}
                      </ThemedText>
                    </>
                  )}
                  {values.length > 0 && <LineChart values={values} height={64} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selectedExercise && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="title">{selectedExercise}</ThemedText>
            {(() => {
              const series = seriesMap[selectedExercise] ?? [];
              const rel = getRelativeSeries(series);
              const values = rel.map((r) => r.pct);
              return (
                <>
                  <LineChart values={values} height={160} color="#06b6d4" strokeWidth={2.5} />
                  <ScrollView style={{ marginTop: 8, maxHeight: 300 }}>
                    {rel.map((r, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                        <ThemedText>{new Date(r.timestamp).toLocaleDateString()}</ThemedText>
                        <ThemedText>{r.est1RM}kg ({r.pct}%)</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </>
              );
            })()}
            <TouchableOpacity onPress={() => setSelectedExercise(null)} style={{ marginTop: 12, padding: 12, backgroundColor: '#2F80ED', borderRadius: 8 }}>
              <ThemedText style={{ color: '#FFFFFF', textAlign: 'center' }}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  splitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  splitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  splitActive: {
    backgroundColor: 'rgba(79,70,229,0.08)'
  },
  list: {
    marginTop: 12,
  },
  row: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)'
  }
  ,
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  }
});
