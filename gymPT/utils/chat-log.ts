import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
};

const STORAGE_CHAT = 'gympt_chat_history';
const STORAGE_LIFTS = 'gympt_lifts';
const STORAGE_GOAL = 'gympt_goal';
const STORAGE_FOOD = 'gympt_food_log';

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
  text: string;
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

export async function setGoal(goal: Goal): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_GOAL, JSON.stringify(goal));
  } catch (e) {
    // ignore
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
  timestamp: number;
};

export async function getFoodLog(): Promise<FoodEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_FOOD);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function addFoodEntry(entry: FoodEntry): Promise<void> {
  try {
    const cur = await getFoodLog();
    cur.push(entry);
    await AsyncStorage.setItem(STORAGE_FOOD, JSON.stringify(cur));
  } catch (e) {
    // ignore
  }
}

export async function clearFoodLog(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_FOOD);
  } catch (e) {
    // ignore
  }
}
