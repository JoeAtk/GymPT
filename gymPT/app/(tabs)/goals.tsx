import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useMemo } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getGoal, getLifts, getFoodLog } from '@/utils/chat-log';
import { getLast9Days } from '@/utils/rag';
import { getExerciseSeries, getRelativeSeries } from '@/utils/progress';

export default function GoalsScreen() {
  const [goalText, setGoalText] = useState<string | null>(null);
  const [goalDate, setGoalDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalWorkouts: number;
    thisWeekWorkouts: number;
    topExerciseProgress: { name: string; improvement: number }[];
    last9Days: { date: string; split: string }[];
    recentTrend: string;
  } | null>(null);

  useEffect(() => {
    loadGoalAndSummary();
  }, []);

  const loadGoalAndSummary = async () => {
    setIsLoading(true);
    const [goal, lifts, foodLog] = await Promise.all([
      getGoal(),
      getLifts(),
      getFoodLog(),
    ]);

    if (goal) {
      setGoalText(goal.displayText || goal.text);
      setGoalDate(new Date(goal.timestamp).toLocaleDateString());
    }

    // Calculate summary stats
    const last9Days = await getLast9Days(lifts);
    const thisWeek = last9Days.slice(-7);
    const workoutDays = thisWeek.filter(d => d.split !== 'rest');

    // Get exercise progress
    const exerciseSeries = getExerciseSeries(lifts);
    const progressData: { name: string; improvement: number }[] = [];

    for (const [exerciseName, series] of Object.entries(exerciseSeries)) {
      if (series.length >= 2) {
        const rel = getRelativeSeries(series);
        const first = rel[0];
        const last = rel[rel.length - 1];
        const improvement = last.pct - 100; // Improvement from baseline
        if (Math.abs(improvement) > 0) {
          progressData.push({ name: exerciseName, improvement });
        }
      }
    }

    // Sort by improvement
    progressData.sort((a, b) => Math.abs(b.improvement) - Math.abs(a.improvement));

    // Determine recent trend
    const recentWorkouts = last9Days.slice(-5).filter(d => d.split !== 'rest').length;
    let trend = 'Steady progress';
    if (recentWorkouts >= 4) trend = 'Excellent consistency! 🔥';
    else if (recentWorkouts >= 2) trend = 'Good momentum';
    else if (recentWorkouts === 1) trend = 'Getting back into it';
    else trend = 'Time to get back on track';

    setSummary({
      totalWorkouts: lifts.length,
      thisWeekWorkouts: workoutDays.length,
      topExerciseProgress: progressData.slice(0, 5),
      last9Days,
      recentTrend: trend,
    });

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        <ThemedText style={{ textAlign: 'center', marginTop: 12 }}>
          Loading goal summary...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Goals</ThemedText>

        {goalText ? (
          <ThemedView style={styles.goalCard}>
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
              Your Goal
            </ThemedText>
            <ThemedText style={styles.goalText}>{goalText}</ThemedText>
            <ThemedText style={styles.goalDate}>Set on {goalDate}</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.goalCard}>
            <ThemedText style={{ opacity: 0.7 }}>
              No goal set yet. Visit the Storage tab to set a goal.
            </ThemedText>
          </ThemedView>
        )}

        {summary && (
          <>
            <ThemedView style={styles.card}>
              <ThemedText type="subtitle">Progress Summary</ThemedText>
              <ThemedView style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Recent Trend:</ThemedText>
                <ThemedText style={styles.statValue}>{summary.recentTrend}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Total Workouts:</ThemedText>
                <ThemedText style={styles.statValue}>{summary.totalWorkouts}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statRow}>
                <ThemedText style={styles.statLabel}>This Week:</ThemedText>
                <ThemedText style={styles.statValue}>
                  {summary.thisWeekWorkouts} workout{summary.thisWeekWorkouts !== 1 ? 's' : ''}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {summary.topExerciseProgress.length > 0 && (
              <ThemedView style={styles.card}>
                <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
                  Top Exercise Progress
                </ThemedText>
                {summary.topExerciseProgress.map((ex, i) => (
                  <ThemedView key={i} style={styles.progressRow}>
                    <ThemedText style={styles.exerciseName}>{ex.name}</ThemedText>
                    <ThemedText
                      style={[
                        styles.progressValue,
                        { color: ex.improvement >= 0 ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {ex.improvement >= 0 ? '+' : ''}
                      {ex.improvement.toFixed(1)}%
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}

            <ThemedView style={styles.card}>
              <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
                Last 9 Days
              </ThemedText>
              {summary.last9Days.map((day, i) => {
                const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                });
                const isToday =
                  day.date === new Date().toISOString().slice(0, 10);
                return (
                  <ThemedView key={i} style={styles.dayRow}>
                    <ThemedText style={styles.dayDate}>
                      {dayOfWeek} {day.date.slice(5)}
                      {isToday && ' (Today)'}
                    </ThemedText>
                    <ThemedView
                      style={[
                        styles.splitBadge,
                        day.split === 'rest'
                          ? styles.restBadge
                          : day.split === 'push'
                          ? styles.pushBadge
                          : day.split === 'pull'
                          ? styles.pullBadge
                          : styles.legBadge,
                      ]}
                    >
                      <ThemedText style={styles.splitText}>{day.split}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                );
              })}
            </ThemedView>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    gap: 16,
  },
  goalCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(47, 128, 237, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(47, 128, 237, 0.3)',
  },
  goalText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  goalDate: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 15,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  exerciseName: {
    fontSize: 14,
    flex: 1,
  },
  progressValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayDate: {
    fontSize: 14,
  },
  splitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  restBadge: {
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
  },
  pushBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  pullBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  legBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  splitText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

