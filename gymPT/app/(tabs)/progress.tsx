import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Sparkline from '@/components/sparkline';
import LineChart from '@/components/linechart';
import { getLifts } from '@/utils/chat-log';
import { getExerciseSeries, getRelativeSeries, DEFAULT_SPLITS } from '@/utils/progress';

export default function ProgressScreen() {
  const [selectedSplit, setSelectedSplit] = useState<string>('push');
  const [lifts, setLifts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getLifts();
      setLifts(data);
    })();
  }, []);

  const seriesMap = useMemo(() => getExerciseSeries(lifts), [lifts]);

  const exercises = DEFAULT_SPLITS[selectedSplit] ?? [];
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Progress</ThemedText>

      <View style={styles.splitRow}>
        {Object.keys(DEFAULT_SPLITS).map((s) => (
          <TouchableOpacity key={s} onPress={() => setSelectedSplit(s)} style={[styles.splitButton, selectedSplit === s && styles.splitActive]}>
            <ThemedText type="subtitle">{s.charAt(0).toUpperCase() + s.slice(1)}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ gap: 12, paddingBottom: 120 }}>
        {exercises.map((ex) => {
          const series = seriesMap[ex] ?? [];
          const rel = getRelativeSeries(series);
          const values = rel.map((r) => r.pct);
          const latest = rel.length ? rel[rel.length - 1].pct : 0;
          return (
            <TouchableOpacity key={ex} style={styles.row} onPress={() => setSelectedExercise(ex)}>
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle">{ex}</ThemedText>
                <ThemedText>Latest: {latest}%</ThemedText>
                <LineChart values={values} height={64} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
                  <ScrollView style={{ marginTop: 8 }}>
                    {rel.map((r, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                        <ThemedText>{new Date(r.timestamp).toLocaleDateString()}</ThemedText>
                        <ThemedText>{r.est1RM} ({r.pct}%)</ThemedText>
                      </View>
                    ))}
                  </ScrollView>
                </>
              );
            })()}
            <TouchableOpacity onPress={() => setSelectedExercise(null)} style={{ marginTop: 12 }}>
              <ThemedText>Close</ThemedText>
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
