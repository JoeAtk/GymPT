import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Rect, Circle } from 'react-native-svg';

type Props = {
  values: number[]; // numeric values, expected 0..100
  height?: number;
  color?: string;
  strokeWidth?: number;
};

export default function LineChart({ values, height = 48, color = '#4F46E5', strokeWidth = 2 }: Props) {
  if (!values || values.length === 0) return <View style={[styles.container, { height }]} />;

  const w = 300; // viewbox width
  const h = Math.max(40, height);
  const max = Math.max(...values, 1);

  // map values to points in SVG coordinate space (origin top-left)
  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = h - (v / max) * (h - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <View style={[styles.container, { height: h }]}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <Rect x="0" y="0" width={w} height={h} fill="transparent" />
        <Polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        {values.map((v, i) => {
          const x = (i / Math.max(1, values.length - 1)) * w;
          const y = h - (v / max) * (h - 8) - 4;
          return <Circle key={i} cx={x} cy={y} r={1.5} fill={color} />;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
