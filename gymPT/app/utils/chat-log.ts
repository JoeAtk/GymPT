import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
};

const STORAGE_KEY = 'gympt_chat_history';

export async function getHistory(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
  } catch (e) {
    // ignore
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}
