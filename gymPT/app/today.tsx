import {
  ScrollView,
  StyleSheet,
  Modal,
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
} from 'react-native';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { appendMessage, getLifts, addLift, getLatestSplit, onLatestSplitChange, type LiftEntry } from '@/utils/chat-log';
import { getNextSplitFromLifts } from '@/utils/rag';
import { parseLiftEntry } from '@/utils/parse-entry';

export default function TodayScreen() {
  const [predictedSplit, setPredictedSplit] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await getLatestSplit();
      if (!mounted) return;
      if (stored) {
        setPredictedSplit(stored);
        return;
      }
      const l = await getLifts();
      const next = await getNextSplitFromLifts(l as any);
      if (mounted) setPredictedSplit(next);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onLatestSplitChange((split) => {
      setPredictedSplit(split);
    });
    return unsubscribe;
  }, []);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseInput, setExerciseInput] = useState('');
  const [exerciseContext, setExerciseContext] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedLift, setParsedLift] = useState<LiftEntry | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const z = (s: string) => s + '\u200B';

  const getWorkoutPlan = (split: string | null) => {
    switch (split) {
      case 'push':
        return {
          title: 'Push — Strength',
          warmup: '5 min rower + band shoulder mobility',
          main: ['Bench Press — 4 x 6', 'Overhead Press — 3 x 8', 'Incline DB Press — 3 x 10'],
          accessories: ['Lateral Raises — 3 x 12', 'Triceps Pushdown — 3 x 12', 'Face Pulls — 3 x 15'],
          finisher: 'Farmer’s Carry — 3 x 40m',
        };
      case 'pull':
        return {
          title: 'Pull — Strength',
          warmup: '5 min rower + band shoulder mobility',
          main: ['Pull-ups — 4 x 6', 'Barbell Row — 4 x 6', 'Romanian Deadlift — 3 x 8'],
          accessories: ['Seated Row — 3 x 12', 'Biceps Curl — 3 x 12', 'Face Pulls — 3 x 15'],
          finisher: 'Suitcase Carry — 3 x 40m',
        };
      case 'leg':
      case 'legs':
        return {
          title: 'Legs — Strength',
          warmup: '5 min bike + hip mobility',
          main: ['Back Squat — 4 x 6', 'Leg Press — 3 x 10', 'Romanian Deadlift — 3 x 8'],
          accessories: ['Leg Extension — 3 x 12', 'Leg Curl — 3 x 12', 'Calf Raises — 3 x 15'],
          finisher: 'Sled Push — 5 x 20m',
        };
      case 'full body':
        return {
          title: 'Full Body — Strength',
          warmup: '5 min rower + dynamic mobility',
          main: ['Squat — 3 x 5', 'Bench Press — 3 x 5', 'Barbell Row — 3 x 5'],
          accessories: ['Split Squat — 3 x 10', 'Pull-ups — 3 x 6', 'Plank — 3 x 45s'],
          finisher: 'Farmer’s Carry — 3 x 40m',
        };
      default:
        return {
          title: 'Upper Body — Strength',
          warmup: '5 min rower + band shoulder mobility',
          main: ['Bench Press — 4 x 6', 'Pull-ups — 4 x 6', 'Overhead Press — 3 x 8'],
          accessories: ['Incline DB Press — 3 x 10', 'Seated Row — 3 x 12', 'Face Pulls — 3 x 15'],
          finisher: 'Farmer’s Carry — 3 x 40m',
        };
    }
  };

  const plan = getWorkoutPlan(predictedSplit ?? null);

  const openLogForItem = (item: string) => {
    const name = item.split('—')[0].trim();
    setExerciseContext(name);
    setExerciseModalOpen(true);
  };


  return (
    <ThemedView style={styles.container}>
      {predictedSplit && (
        <ThemedView style={styles.predictedContainer}>
          <ThemedText type="subtitle">Predicted today: {predictedSplit}</ThemedText>
        </ThemedView>
      )}
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Today’s Workout Split</ThemedText>
        <ThemedText type="subtitle">{plan.title}</ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Warm-up</ThemedText>
          <ThemedText>{plan.warmup}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Main Lifts</ThemedText>
          {plan.main.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => openLogForItem(item)}>
              <ThemedText>{item}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Accessories</ThemedText>
          {plan.accessories.map((item) => (
            <TouchableOpacity key={item} onPress={() => openLogForItem(item)}>
              <ThemedText>{item}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Finisher</ThemedText>
          <TouchableOpacity onPress={() => openLogForItem(plan.finisher)}>
            <ThemedText>{plan.finisher}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      <Modal visible={exerciseModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="title">Log: {exerciseContext}</ThemedText>
            <RNTextInput
              placeholder="e.g. 4 sets of 6 at 100kg, then a drop set"
              placeholderTextColor="#8E8E93"
              style={styles.modalInput}
              value={exerciseInput}
              onChangeText={setExerciseInput}
              editable={!isParsing}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.listButton}
                onPress={() => {
                  setExerciseModalOpen(false);
                  setExerciseInput('');
                }}>
                <ThemedText style={{ color: '#FFFFFF' }}>{z('Cancel')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                disabled={isParsing}
                onPress={async () => {
                  const text = exerciseInput.trim();
                  if (!text) return;
                  setIsParsing(true);
                  try {
                    const key = (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
                    const parsed = await parseLiftEntry(`${exerciseContext ?? ''}: ${text}`, key);
                    if (!parsed.name || parsed.name === 'Unknown') parsed.name = exerciseContext ?? parsed.name;
                    setParsedLift(parsed);
                    setPreviewOpen(true);
                  } catch (err) {
                    appendMessage({ role: 'model', text: `Could not parse entry: ${String(err)}`, timestamp: Date.now() }).catch(() => {});
                  } finally {
                    setIsParsing(false);
                  }
                }}>
                <ThemedText style={{ color: '#FFFFFF' }}>{isParsing ? z('Parsing...') : z('Parse')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview modal showing what the model inferred */}
      <Modal visible={previewOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText type="title">Inferred Entry</ThemedText>
            {parsedLift ? (
              <View style={{ marginTop: 8 }}>
                <ThemedText>Name: {parsedLift.name}</ThemedText>
                <ThemedText>Sets: {parsedLift.sets}</ThemedText>
                <ThemedText>Reps: {parsedLift.reps}</ThemedText>
                <ThemedText>Weight: {parsedLift.weight ?? '—'}</ThemedText>
                <ThemedText>Date: {new Date(parsedLift.timestamp).toLocaleString()}</ThemedText>
              </View>
            ) : (
              <ThemedText>No parsed data available.</ThemedText>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.listButton}
                onPress={() => {
                  // return to editing without saving
                  setPreviewOpen(false);
                }}>
                <ThemedText style={{ color: '#FFFFFF' }}>{z('Edit')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={async () => {
                  if (!parsedLift) return;
                  try {
                    await addLift(parsedLift);
                    appendMessage({ role: 'model', text: `Saved: ${parsedLift.name} ${parsedLift.sets}x${parsedLift.reps} @ ${parsedLift.weight ?? '—'}`, timestamp: Date.now() }).catch(() => {});
                    setPreviewOpen(false);
                    setExerciseModalOpen(false);
                    setExerciseInput('');
                    setParsedLift(null);
                    const l = await getLifts();
                    const next = await getNextSplitFromLifts(l as any);
                    setPredictedSplit(next);
                  } catch (err) {
                    appendMessage({ role: 'model', text: `Could not save parsed entry: ${String(err)}`, timestamp: Date.now() }).catch(() => {});
                  }
                }}>
                <ThemedText style={{ color: '#FFFFFF' }}>{z('Confirm')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  predictedContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2F80ED',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    padding: 24,
    paddingTop: 32,
    gap: 16,
  },
  listButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(142,142,147,0.12)',
  },
  listButtonText: {
    color: '#FFFFFF',
  },
  card: {
    padding: 16,
    borderRadius: 14,
    gap: 6,
    backgroundColor: 'rgba(142,142,147,0.1)',
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  modalInput: {
    minHeight: 80,
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'rgba(142,142,147,0.06)',
    color: '#000',
  },
});
