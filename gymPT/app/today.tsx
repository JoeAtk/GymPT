import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useMemo, useState, useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { appendMessage, getHistory } from '@/utils/chat-log';

export default function TodayScreen() {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);

  const apiKey = useMemo(() => (process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim(), []);

  useEffect(() => {
    let mounted = true;
    getHistory().then((h: any) => {
      if (!mounted) return;
      // stored items include timestamp; map to current message shape
      setMessages(h.map((m: any) => ({ role: m.role, text: m.text })));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchModels = async () => {
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY.' },
      ]);
      return;
    }

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error?.message ?? 'Failed to list models.';
        setMessages((prev) => [...prev, { role: 'model', text: `List models error: ${err}` }]);
        return;
      }

      const models = data?.models ?? [];
      if (models.length === 0) {
        setMessages((prev) => [...prev, { role: 'model', text: 'No models returned.' }]);
        return;
      }

      // For clearer diagnostics, fetch detail for first 20 models to show supported methods.
      const limited = models.slice(0, 20);
      const details: string[] = [];

      await Promise.all(
        limited.map(async (m: any) => {
          try {
            // Use the model name as returned (e.g. "models/gemini-2.5-flash").
            const name = m.name;
            const r = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`
            );
            const text = await r.text();
            let d: any = undefined;
            try {
              d = JSON.parse(text);
            } catch (_) {
              // not JSON
            }

            if (r.ok) {
              const methods = d?.supportedMethods ? d.supportedMethods.join(',') : 'none';
              details.push(`${m.name} (${methods})`);
            } else {
              const errMsg = d?.error?.message ?? text ?? `status ${r.status}`;
              details.push(`${m.name} (detail error: ${errMsg})`);
            }
          } catch (err) {
            details.push(`${m.name} (network error: ${String(err)})`);
          }
        })
      );

      setMessages((prev) => [...prev, { role: 'model', text: details.join('\n') }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'model', text: 'Network error listing models.' }]);
    }
  };
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
    // persist user message
    appendMessage({ role: 'user', text: trimmed, timestamp: Date.now() }).catch(() => {});

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: trimmed }],
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

      const modelMsg = { role: 'model' as const, text: modelText };
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
      <ThemedView style={styles.chatBar}>
        <TextInput
          placeholder="Ask Gemini about today’s workout..."
          placeholderTextColor="#8E8E93"
          style={styles.chatInput}
          value={input}
          onChangeText={setInput}
          editable={!isSending}
          returnKeyType="send"
          onSubmitEditing={(e: any) => sendMessage(e.nativeEvent.text)}
        />
        <Pressable style={styles.sendButton} onPress={sendMessage} disabled={isSending}>
          <ThemedText style={styles.sendButtonText}>{isSending ? '...' : 'Send'}</ThemedText>
        </Pressable>
        
      </ThemedView>

      <ScrollView contentContainerStyle={styles.content}>
        {messages.length > 0 && (
          <ThemedView style={styles.chatContainer}>
            {messages.map((message, index) => (
              <ThemedView
                key={`${message.role}-${index}`}
                style={[
                  styles.chatBubble,
                  message.role === 'user' ? styles.userBubble : styles.modelBubble,
                ]}>
                <ThemedText
                  style={[
                    styles.chatText,
                    message.role === 'user' ? styles.userText : styles.modelText,
                  ]}>
                  {message.text}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        )}
        <ThemedText type="title">Today’s Workout Split</ThemedText>
        <ThemedText type="subtitle">Upper Body — Strength</ThemedText>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Warm-up</ThemedText>
          <ThemedText>5 min rower + band shoulder mobility</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Main Lifts</ThemedText>
          <ThemedText>Bench Press — 4 x 6</ThemedText>
          <ThemedText>Pull-ups — 4 x 6</ThemedText>
          <ThemedText>Overhead Press — 3 x 8</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Accessories</ThemedText>
          <ThemedText>Incline DB Press — 3 x 10</ThemedText>
          <ThemedText>Seated Row — 3 x 12</ThemedText>
          <ThemedText>Face Pulls — 3 x 15</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Finisher</ThemedText>
          <ThemedText>Farmer’s Carry — 3 x 40m</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatBar: {
    paddingHorizontal: 16,
    paddingTop: 32,
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
  content: {
    padding: 24,
    paddingTop: 32,
    gap: 16,
  },
  chatContainer: {
    gap: 10,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 12,
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
  },
  userText: {
    color: '#FFFFFF',
  },
  modelText: {
    color: '#FFFFFF',
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
});
