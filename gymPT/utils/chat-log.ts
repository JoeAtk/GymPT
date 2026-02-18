import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
};

export type NutritionTargets = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
};

const STORAGE_CHAT = 'gympt_chat_history';
const STORAGE_LIFTS = 'gympt_lifts';
const STORAGE_GOAL = 'gympt_goal';
const STORAGE_FOOD = 'gympt_food_log';
const STORAGE_LATEST_SPLIT = 'gympt_latest_split';
const STORAGE_TARGETS = 'gympt_nutrition_targets';

const latestSplitListeners = new Set<(split: string) => void>();
const STORAGE_PROFILE = 'gympt_user_profile';
const STORAGE_EXERCISE_CATEGORIES = 'gympt_exercise_categories';

// Chat history
export async function getHistory(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CHAT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function appendMessage(message: ChatMessage): Promise<void> {
  try {
    const cur = await getHistory();
    cur.push(message);
    await AsyncStorage.setItem(STORAGE_CHAT, JSON.stringify(cur));
  } catch (e) {
    // ignore
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_CHAT);
  } catch (e) {
    // ignore
  }
}

// Lifts/log entries
export type LiftEntry = {
  name: string;
  sets: number;
  reps: number;
  weight?: number; // optional kg/lb
  timestamp: number;
};

export async function getLifts(): Promise<LiftEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_LIFTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function addLift(entry: LiftEntry): Promise<void> {
  try {
    const cur = await getLifts();
    cur.push(entry);
    await AsyncStorage.setItem(STORAGE_LIFTS, JSON.stringify(cur));
  } catch (e) {
    // ignore
  }
}

export async function clearLifts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_LIFTS);
  } catch (e) {
    // ignore
  }
}

// Goal (single)
export type Goal = {
  text: string; // Used for RAG context
  displayText?: string; // Nicely worded version for display
  timestamp: number;
};

export async function getGoal(): Promise<Goal | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_GOAL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function setGoal(goal: Goal, apiKey?: string): Promise<void> {
  try {
    // Generate nicely worded version if API key is provided and displayText doesn't exist
    if (apiKey && !goal.displayText) {
      const displayText = await generateNicelyWordedGoal(goal.text, apiKey);
      goal.displayText = displayText;
    }
    await AsyncStorage.setItem(STORAGE_GOAL, JSON.stringify(goal));
  } catch (e) {
    // ignore
  }
}

/**
 * Generate a nicely worded version of a goal using AI
 */
export async function generateNicelyWordedGoal(goalText: string, apiKey: string): Promise<string> {
  const prompt = `Rewrite this fitness goal in a motivating, clear, and professional way. Keep it concise (1-2 sentences max). Make it inspiring but realistic.

Original goal: "${goalText}"

Rewritten goal (respond with ONLY the rewritten goal, no other text):`;

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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (text) {
      // Remove quotes if AI added them
      return text.replace(/^["']|["']$/g, '');
    }
    return goalText; // Fallback to original
  } catch (e) {
    return goalText; // Fallback to original
  }
}

export async function clearGoal(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_GOAL);
  } catch (e) {
    // ignore
  }
}

// Food log entries
export type FoodEntry = {
  name: string;
  calories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  fiberGrams?: number;
  timestamp: number;
};

export async function getFoodLog(): Promise<FoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_FOOD);
    console.log('[getFoodLog] Retrieved from AsyncStorage:', raw ? `${raw.length} bytes (stored ${raw.length > 2 ? 'non-empty' : 'empty'})` : 'null/undefined');
    if (!raw) {
      console.log('[getFoodLog] No data in storage, returning empty array');
      return [];
    }
    const parsed = JSON.parse(raw);
    console.log('[getFoodLog] Parsed:', Array.isArray(parsed) ? `${parsed.length} entries` : 'not an array');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[getFoodLog] Error:', e);
    return [];
  }
}

export async function addFoodEntry(entry: FoodEntry): Promise<void> {
  try {
    console.log('[addFoodEntry] Adding:', entry.name, 'calories:', entry.calories);
    const raw = await AsyncStorage.getItem(STORAGE_FOOD);
    let cur: FoodEntry[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        cur = Array.isArray(parsed) ? parsed : [];
        console.log('[addFoodEntry] Got', cur.length, 'existing entries');
      } catch (parseErr) {
        console.error('[addFoodEntry] Parse error, starting fresh:', parseErr);
        cur = [];
      }
    } else {
      console.log('[addFoodEntry] No existing entries, starting fresh');
    }
    cur.push(entry);
    const jsonStr = JSON.stringify(cur);
    console.log('[addFoodEntry] Saving', cur.length, 'entries (~', jsonStr.length, 'bytes)');
    await AsyncStorage.setItem(STORAGE_FOOD, jsonStr);
    console.log('[addFoodEntry] Successfully saved');
  } catch (e) {
    console.error('[addFoodEntry] Error:', e);
  }
}

export async function clearFoodLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_FOOD);
  } catch (e) {
    // ignore
  }
}

// Nutrition targets
export async function getNutritionTargets(): Promise<NutritionTargets | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_TARGETS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function setNutritionTargets(targets: NutritionTargets): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_TARGETS, JSON.stringify(targets));
  } catch (e) {
    // ignore
  }
}

// Latest split (persisted override)
export async function getLatestSplit(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_LATEST_SPLIT);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function setLatestSplit(split: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_LATEST_SPLIT, JSON.stringify(split));
    latestSplitListeners.forEach((cb) => cb(split));
  } catch (e) {
    // ignore
  }
}

export function onLatestSplitChange(listener: (split: string) => void): () => void {
  latestSplitListeners.add(listener);
  return () => {
    latestSplitListeners.delete(listener);
  };
}

// User profile
export type UserProfile = {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  build?: 'ectomorph' | 'mesomorph' | 'endomorph';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
  dailyCaloriesTarget?: number;
  dailyProteinTarget?: number;
  dailyCarbsTarget?: number;
  dailyFatsTarget?: number;
  updatedAt?: number;
};

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  try {
    const updated = { ...profile, updatedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_PROFILE, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
}

export async function clearUserProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_PROFILE);
  } catch (e) {
    // ignore
  }
}

// Exercise categorization
export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'unknown';
export type ExerciseCategoryMap = Record<string, ExerciseCategory>;

export async function getExerciseCategories(): Promise<ExerciseCategoryMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_EXERCISE_CATEGORIES);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export async function setExerciseCategory(exerciseName: string, category: ExerciseCategory): Promise<void> {
  try {
    const categories = await getExerciseCategories();
    categories[exerciseName.toLowerCase()] = category;
    await AsyncStorage.setItem(STORAGE_EXERCISE_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    // ignore
  }
}

export async function clearExerciseCategories(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_EXERCISE_CATEGORIES);
  } catch (e) {
    // ignore
  }
}
