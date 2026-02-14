import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from './themed-text';

const STORAGE_KEY = 'gympt_search_query';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!mounted) return;
      if (v) setQuery(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const save = async (text: string) => {
    setQuery(text);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, text);
    } catch (_) {
      // ignore
    }
  };

  const clear = async () => {
    setQuery('');
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}> 
      <TextInput
        placeholder="Search workouts, goals or food..."
        placeholderTextColor="#8E8E93"
        value={query}
        onChangeText={save}
        style={styles.input}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <Pressable onPress={clear} style={styles.clearButton}>
          <ThemedText>Clear</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(142,142,147,0.12)',
    color: '#FFFFFF',
  },
  clearButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(142,142,147,0.12)',
  },
});
