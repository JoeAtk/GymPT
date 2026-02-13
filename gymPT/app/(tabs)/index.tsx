import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">GymPT</ThemedText>
      </ThemedView>
      <ThemedText type="subtitle">Homepage</ThemedText>
      <ThemedText>
        Welcome back. Start a workout, review your plan, or check today&apos;s focus.
      </ThemedText>
      <Pressable style={styles.todayButton} onPress={() => router.push('/today')}>
        <ThemedText type="title" style={styles.todayButtonText}>
          Today
        </ThemedText>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.push('/(tabs)/goals')}>
        <ThemedText type="subtitle" style={styles.secondaryButtonText}>
          Goals
        </ThemedText>
      </Pressable>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.push('/(tabs)/food-tracker')}>
        <ThemedText type="subtitle" style={styles.secondaryButtonText}>
          Food Tracker
        </ThemedText>
      </Pressable>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F80ED',
  },
  todayButtonText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142,142,147,0.16)',
  },
  secondaryButtonText: {
    color: '#111111',
  },
});
