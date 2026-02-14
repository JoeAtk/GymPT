import { LiftEntry, getGoal, getLifts, getFoodLog, getUserProfile, FoodEntry, UserProfile, getExerciseCategories, setExerciseCategory, ExerciseCategory } from './chat-log';

export type Split = 'leg' | 'push' | 'pull' | 'full body' | 'rest' | 'unknown';

/**
 * Classify exercise using built-in rules
 */
export function classifyLiftByPattern(name: string): Split {
  const n = name.toLowerCase();
  if (/(squat|leg press|leg extension|leg curl|lunge|hamstring|glute|calf|rdl|romanian)/.test(n)) return 'leg';
  if (/(bench|press|overhead|push|chest|tricep|shoulder|dip|fly|flye|pec)/.test(n)) return 'push';
  if (/(row|pull|deadlift|chin|biceps|bicep|lat|back|pull-up|pullup|curl)/.test(n)) return 'pull';
  return 'unknown';
}

/**
 * Classify exercise - first check stored categories, then use pattern matching
 */
export async function classifyLift(name: string): Promise<Split> {
  const categories = await getExerciseCategories();
  const stored = categories[name.toLowerCase()];
  
  if (stored && stored !== 'unknown') {
    return stored === 'legs' ? 'leg' : stored;
  }
  
  return classifyLiftByPattern(name);
}

/**
 * Use AI to categorize an unknown exercise
 */
export async function categorizeExerciseWithAI(exerciseName: string, apiKey: string): Promise<ExerciseCategory> {
  const prompt = `Categorize this exercise: "${exerciseName}"

Respond with ONLY ONE WORD from these options:
- push (chest, shoulders, triceps)
- pull (back, biceps)
- legs (quads, hamstrings, glutes, calves)
- unknown (if you're unsure)

Your answer (one word only):`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || 'unknown';
    
    if (['push', 'pull', 'legs'].includes(text)) {
      return text as ExerciseCategory;
    }
    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

export async function getSessionSplitFromLifts(sessionLifts: LiftEntry[]): Promise<Split> {
  const counts: Record<string, number> = {};
  for (const l of sessionLifts) {
    const s = await classifyLift(l.name);
    counts[s] = (counts[s] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 'unknown';
  const top = entries[0][0];
  if (top === 'unknown') return 'unknown';
  return top as Split;
}

export async function getNextSplitFromLifts(lifts: LiftEntry[] | undefined): Promise<Split> {
  if (!lifts || lifts.length === 0) return 'full body';
  // group lifts by day (YYYY-MM-DD)
  const byDay: Record<string, LiftEntry[]> = {};
  for (const l of lifts) {
    const d = new Date(l.timestamp).toISOString().slice(0, 10);
    byDay[d] = byDay[d] || [];
    byDay[d].push(l);
  }
  const days = Object.keys(byDay).sort();
  const lastDay = days[days.length - 1];
  const lastSession = byDay[lastDay] ?? [];
  const lastSplit = await getSessionSplitFromLifts(lastSession);

  // simple cycle: leg -> push -> pull -> leg
  if (lastSplit === 'leg') return 'push';
  if (lastSplit === 'push') return 'pull';
  if (lastSplit === 'pull') return 'leg';
  // fallback
  return 'full body';
}

/**
 * Get the last 9 days of exercise history with their splits
 */
export async function getLast9Days(lifts: LiftEntry[]): Promise<{ date: string; split: Split }[]> {
  if (!lifts || lifts.length === 0) return [];

  // Group lifts by day
  const byDay: Record<string, LiftEntry[]> = {};
  for (const l of lifts) {
    const d = new Date(l.timestamp).toISOString().slice(0, 10);
    byDay[d] = byDay[d] || [];
    byDay[d].push(l);
  }

  // Get all unique days sorted
  const days = Object.keys(byDay).sort();
  
  // Get today and the last 8 days before
  const today = new Date();
  const result: { date: string; split: Split }[] = [];
  
  for (let i = 8; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);
    
    const dayLifts = byDay[dateStr];
    if (dayLifts && dayLifts.length > 0) {
      const split = await getSessionSplitFromLifts(dayLifts);
      result.push({ date: dateStr, split });
    } else {
      result.push({ date: dateStr, split: 'rest' });
    }
  }

  return result;
}

/**
 * Extract exercise names from user query
 */
export function extractExerciseNames(query: string, allLifts: LiftEntry[]): string[] {
  const queryLower = query.toLowerCase();
  const uniqueExercises = new Set<string>();
  
  // Get all unique exercise names from history
  for (const lift of allLifts) {
    uniqueExercises.add(lift.name);
  }
  
  // Check which exercises are mentioned in the query
  const mentioned: string[] = [];
  for (const exercise of uniqueExercises) {
    if (queryLower.includes(exercise.toLowerCase())) {
      mentioned.push(exercise);
    }
  }
  
  return mentioned;
}

/**
 * Get exercise stats for a specific exercise
 */
export function getExerciseStats(exerciseName: string, lifts: LiftEntry[]): {
  totalSessions: number;
  lastSession: LiftEntry | null;
  best: LiftEntry | null;
  history: LiftEntry[];
} {
  const exerciseLifts = lifts.filter(
    (l) => l.name.toLowerCase() === exerciseName.toLowerCase()
  );
  
  if (exerciseLifts.length === 0) {
    return { totalSessions: 0, lastSession: null, best: null, history: [] };
  }
  
  // Sort by timestamp descending
  const sorted = [...exerciseLifts].sort((a, b) => b.timestamp - a.timestamp);
  
  // Find best (highest weight * reps)
  let best = sorted[0];
  let bestScore = (best.weight ?? 0) * best.reps;
  
  for (const lift of sorted) {
    const score = (lift.weight ?? 0) * lift.reps;
    if (score > bestScore) {
      best = lift;
      bestScore = score;
    }
  }
  
  return {
    totalSessions: exerciseLifts.length,
    lastSession: sorted[0],
    best,
    history: sorted.slice(0, 10), // Last 10 sessions
  };
}

/**
 * Check if query is food/nutrition related
 */
export function isFoodRelatedQuery(query: string): boolean {
  const foodKeywords = [
    'food', 'eat', 'meal', 'calories', 'calorie', 'protein', 'carb', 'carbs', 'fat', 'fats',
    'macro', 'macros', 'nutrition', 'diet', 'weight', 'bulk', 'cut', 'cutting', 'bulking',
    'breakfast', 'lunch', 'dinner', 'snack', 'hungry', 'appetite', 'fiber', 'sodium',
    'supplement', 'vitamin', 'nutrient', 'intake', 'consume', 'consumed'
  ];
  
  const lowerQuery = query.toLowerCase();
  return foodKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Get food log for the last N days
 */
export function getLastNDaysFoodLog(foodLog: FoodEntry[], days: number): { date: string; entries: FoodEntry[]; totals: { calories: number; protein: number; carbs: number; fats: number } }[] {
  const today = new Date();
  const result: { date: string; entries: FoodEntry[]; totals: { calories: number; protein: number; carbs: number; fats: number } }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);
    
    const dayEntries = foodLog.filter(entry => {
      const entryDate = new Date(entry.timestamp).toISOString().slice(0, 10);
      return entryDate === dateStr;
    });
    
    const totals = dayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + (entry.proteinGrams ?? 0),
        carbs: acc.carbs + (entry.carbsGrams ?? 0),
        fats: acc.fats + (entry.fatsGrams ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    
    result.push({ date: dateStr, entries: dayEntries, totals });
  }
  
  return result;
}

/**
 * Build RAG context for AI queries
 * Always includes: goal, last 9 days, today's food
 * Conditionally includes: exercise-specific stats if exercises are mentioned
 * Conditionally includes: past few days food + profile if food-related query
 */
export async function buildRAGContext(userQuery: string): Promise<string> {
  const [goal, lifts, foodLog, profile] = await Promise.all([
    getGoal(),
    getLifts(),
    getFoodLog(),
    getUserProfile(),
  ]);
  
  let context = '=== USER CONTEXT ===\n\n';
  
  // Always add goal
  if (goal) {
    context += `GOAL: ${goal.text}\n(Set on: ${new Date(goal.timestamp).toLocaleDateString()})\n\n`;
  } else {
    context += 'GOAL: No goal set yet\n\n';
  }
  
  // Always add last 9 days workout history
  const last9Days = await getLast9Days(lifts);
  context += 'LAST 9 DAYS WORKOUTS:\n';
  for (const day of last9Days) {
    const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
    context += `  ${day.date} (${dayOfWeek}): ${day.split}\n`;
  }
  context += '\n';
  
  // Always add today's food
  const todayFood = getLastNDaysFoodLog(foodLog, 1)[0];
  if (todayFood && todayFood.entries.length > 0) {
    context += 'TODAY\'S FOOD:\n';
    context += `  Total: ${todayFood.totals.calories} cal, ${todayFood.totals.protein}g protein, ${todayFood.totals.carbs}g carbs, ${todayFood.totals.fats}g fats\n`;
    if (todayFood.entries.length <= 5) {
      for (const entry of todayFood.entries) {
        context += `  - ${entry.name}: ${entry.calories} cal`;
        if (entry.proteinGrams || entry.carbsGrams || entry.fatsGrams) {
          context += ` (P:${entry.proteinGrams ?? 0}g C:${entry.carbsGrams ?? 0}g F:${entry.fatsGrams ?? 0}g)`;
        }
        context += '\n';
      }
    } else {
      context += `  (${todayFood.entries.length} entries logged)\n`;
    }
    context += '\n';
  } else {
    context += 'TODAY\'S FOOD: No food logged yet\n\n';
  }
  
  // Check if user is asking about specific exercises
  const mentionedExercises = extractExerciseNames(userQuery, lifts);
  
  if (mentionedExercises.length > 0) {
    context += 'EXERCISE-SPECIFIC STATS:\n\n';
    for (const exercise of mentionedExercises) {
      const stats = getExerciseStats(exercise, lifts);
      context += `${exercise}:\n`;
      context += `  Total sessions: ${stats.totalSessions}\n`;
      
      if (stats.lastSession) {
        context += `  Last session: ${stats.lastSession.sets}x${stats.lastSession.reps}`;
        if (stats.lastSession.weight) {
          context += ` @ ${stats.lastSession.weight}kg`;
        }
        context += ` (${new Date(stats.lastSession.timestamp).toLocaleDateString()})\n`;
      }
      
      if (stats.best) {
        context += `  Best: ${stats.best.sets}x${stats.best.reps}`;
        if (stats.best.weight) {
          context += ` @ ${stats.best.weight}kg`;
        }
        context += ` (${new Date(stats.best.timestamp).toLocaleDateString()})\n`;
      }
      
      if (stats.history.length > 0) {
        context += '  Recent history:\n';
        for (const h of stats.history.slice(0, 5)) {
          context += `    ${new Date(h.timestamp).toLocaleDateString()}: ${h.sets}x${h.reps}`;
          if (h.weight) {
            context += ` @ ${h.weight}kg`;
          }
          context += '\n';
        }
      }
      
      context += '\n';
    }
  }
  
  // If food-related query, add detailed food and profile info
  if (isFoodRelatedQuery(userQuery)) {
    context += 'NUTRITION DETAILS:\n\n';
    
    // Add user profile if available
    if (profile) {
      context += 'User Profile:\n';
      if (profile.weightKg) context += `  Weight: ${profile.weightKg} kg\n`;
      if (profile.heightCm) context += `  Height: ${profile.heightCm} cm\n`;
      if (profile.age) context += `  Age: ${profile.age}\n`;
      if (profile.gender) context += `  Gender: ${profile.gender}\n`;
      if (profile.build) context += `  Build: ${profile.build}\n`;
      if (profile.activityLevel) context += `  Activity Level: ${profile.activityLevel}\n`;
      
      if (profile.dailyCaloriesTarget || profile.dailyProteinTarget || profile.dailyCarbsTarget || profile.dailyFatsTarget) {
        context += '  Daily Targets: ';
        const targets = [];
        if (profile.dailyCaloriesTarget) targets.push(`${profile.dailyCaloriesTarget} cal`);
        if (profile.dailyProteinTarget) targets.push(`${profile.dailyProteinTarget}g protein`);
        if (profile.dailyCarbsTarget) targets.push(`${profile.dailyCarbsTarget}g carbs`);
        if (profile.dailyFatsTarget) targets.push(`${profile.dailyFatsTarget}g fats`);
        context += targets.join(', ') + '\n';
      }
      context += '\n';
    } else {
      context += 'User Profile: Not set\n\n';
    }
    
    // Add last 7 days food log with targets achieved
    const last7DaysFood = getLastNDaysFoodLog(foodLog, 7);
    context += 'Last 7 Days Food Log:\n';
    for (const day of last7DaysFood) {
      const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      context += `  ${day.date} (${dayOfWeek}): `;
      
      if (day.entries.length === 0) {
        context += 'No food logged\n';
      } else {
        context += `${day.totals.calories} cal, ${day.totals.protein}g protein, ${day.totals.carbs}g carbs, ${day.totals.fats}g fats`;
        
        // Show target achievement if targets are set
        if (profile) {
          const achievements = [];
          if (profile.dailyCaloriesTarget) {
            const pct = Math.round((day.totals.calories / profile.dailyCaloriesTarget) * 100);
            achievements.push(`${pct}% cal`);
          }
          if (profile.dailyProteinTarget) {
            const pct = Math.round((day.totals.protein / profile.dailyProteinTarget) * 100);
            achievements.push(`${pct}% protein`);
          }
          if (achievements.length > 0) {
            context += ` (${achievements.join(', ')})`;
          }
        }
        
        context += '\n';
      }
    }
    context += '\n';
  }
  
  context += '=== END CONTEXT ===\n\n';
  context += `USER QUERY: ${userQuery}`;
  
  return context;
}
