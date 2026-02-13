import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FoodTrackerScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Food Tracker</ThemedText>
      <ThemedText>Log meals, calories, and macros here.</ThemedText>
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
});
