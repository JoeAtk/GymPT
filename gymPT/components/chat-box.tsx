import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  addFoodEntry,
  addLift,
  appendMessage,
  getHistory,
  setGoal,
  setLatestSplit,
  setNutritionTargets,
} from '@/utils/chat-log';
import { buildRAGContext, extractControlBlock } from '@/utils/rag';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const apiKey = useMemo(() => (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim(), []);
  const chatScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let mounted = true;
    getHistory().then((h: any) => {
      if (!mounted) return;
      setMessages(
        h.map((m: any) => {
          if (m.role === 'model') {
            const { reply } = extractControlBlock(String(m.text ?? ''));
            return { role: m.role, text: reply || String(m.text ?? '') };
          }
          return { role: m.role, text: String(m.text ?? '') };
        })
      );
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const sendMessage = async (value?: string) => {
    const trimmed = (value ?? input).trim();
    if (!trimmed || isSending) return;

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY.' },
      ]);
      return;
    }

    setInput('');
    setIsSending(true);
    const userMsg = { role: 'user' as const, text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    appendMessage({ role: 'user', text: trimmed, timestamp: Date.now() }).catch(() => {});

    try {
      const contextualPrompt = await buildRAGContext(trimmed);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: contextualPrompt }],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data?.error?.message ?? 'Gemini request failed.';
        setMessages((prev) => [...prev, { role: 'model', text: errorMessage }]);
        return;
      }

      const modelText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text)
          .filter(Boolean)
          .join('') ||
        'No response returned by the model.';

      const { control, reply } = extractControlBlock(modelText);

      if (control) {
        const splitChange = control.change?.split;
        if (splitChange && splitChange !== 'unknown') {
          setLatestSplit(splitChange).catch(() => {});
        }

        const store = control.store;
        if (store?.lifts && Array.isArray(store.lifts)) {
          for (const l of store.lifts) {
            await addLift({
              name: l.name,
              sets: l.sets,
              reps: l.reps,
              weight: l.weight,
              timestamp: l.timestamp ?? Date.now(),
            });
          }
        }
        if (store?.goal?.text) {
          await setGoal({ text: store.goal.text, timestamp: Date.now() });
        }
        if (store?.food && Array.isArray(store.food)) {
          for (const f of store.food) {
            await addFoodEntry({
              name: f.name,
              calories: f.calories,
              proteinGrams: f.proteinGrams,
              carbsGrams: f.carbsGrams,
              fatsGrams: f.fatsGrams,
              fiberGrams: f.fiberGrams,
              timestamp: f.timestamp ?? Date.now(),
            });
          }
        }
        if (store?.targets) {
          await setNutritionTargets(store.targets);
        }
      }

      const modelMsg = { role: 'model' as const, text: reply || modelText };
      setMessages((prev) => [...prev, modelMsg]);
      appendMessage({ role: 'model', text: modelText, timestamp: Date.now() }).catch(() => {});
    } catch (error) {
      const errText = 'Sorry, I could not reach Gemini. Try again.';
      setMessages((prev) => [...prev, { role: 'model', text: errText }]);
      appendMessage({ role: 'model', text: errText, timestamp: Date.now() }).catch(() => {});
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable style={styles.header} onPress={() => setIsCollapsed((v) => !v)}>
        <ThemedText style={styles.headerText}>Chat</ThemedText>
        <ThemedText style={styles.headerText}>{isCollapsed ? 'Expand' : 'Minimize'}</ThemedText>
      </Pressable>
      {!isCollapsed && (
        <>
          <ThemedView style={styles.chatBar}>
            <TextInput
              placeholder="Ask Gemini about your day..."
              placeholderTextColor="#8E8E93"
              style={styles.chatInput}
              value={input}
              onChangeText={setInput}
              editable={!isSending}
              returnKeyType="send"
              onSubmitEditing={(e: any) => sendMessage(e.nativeEvent.text)}
            />
            <Pressable style={styles.sendButton} onPress={() => sendMessage()} disabled={isSending}>
              <ThemedText style={styles.sendButtonText}>{isSending ? '...' : 'Send'}</ThemedText>
            </Pressable>
          </ThemedView>

          {messages.length > 0 && (
            <ThemedView style={styles.chatContainer}>
              <ScrollView ref={chatScrollRef} showsVerticalScrollIndicator>
                {messages.map((message, index) => (
                  <ThemedView
                    key={`${message.role}-${index}`}
                    style={[
                      styles.chatBubble,
                      message.role === 'user' ? styles.userBubble : styles.modelBubble,
                    ]}>
                    {message.role === 'model' ? (
                      <Markdown style={markdownStyles}>{String(message.text)}</Markdown>
                    ) : (
                      <ThemedText style={[styles.chatText, styles.userText]}>
                        {String(message.text)}
                      </ThemedText>
                    )}
                  </ThemedView>
                ))}
              </ScrollView>
            </ThemedView>
          )}
        </>
      )}
    </ThemedView>
  );
}

const markdownStyles = {
  body: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  paragraph: {
    color: '#FFFFFF',
    marginTop: 0,
    marginBottom: 8,
  },
  bullet_list: {
    marginVertical: 6,
  },
  ordered_list: {
    marginVertical: 6,
  },
  code_inline: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  code_block: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 6,
  },
  fence: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    borderRadius: 6,
  },
  link: {
    color: '#7CB8FF',
  },
  blockquote: {
    borderLeftColor: 'rgba(255,255,255,0.25)',
    borderLeftWidth: 4,
    paddingLeft: 8,
    color: '#FFFFFF',
  },
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  chatInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(142,142,147,0.12)',
    color: '#FFFFFF',
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
  chatContainer: {
    gap: 10,
    maxHeight: 220,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2F80ED',
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1E',
  },
  chatText: {
    fontSize: 14,
    paddingRight: 2,
  },
  userText: {
    color: '#FFFFFF',
  },
});
