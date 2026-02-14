import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  values: number[]; // numeric values normalized to 0..100
  height?: number;
  color?: string;
};

export default function Sparkline({ values, height = 40, color = '#4F46E5' }: Props) {
  if (!values || values.length === 0) return <View style={[styles.container, { height }]} />;
  const max = Math.max(...values, 1);
  return (
    <View style={[styles.container, { height }]}>
      {values.map((v, i) => {
        const w = 100 / values.length;
        const h = (v / max) * height;
        return <View key={i} style={[styles.bar, { left: `${i * w}%`, width: `${w - 4}%`, height: h, backgroundColor: color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 2,
    opacity: 0.95,
  },
});
