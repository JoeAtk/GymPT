import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Rect, Circle, Line } from 'react-native-svg';
import { ThemedText } from './themed-text';

type Props = {
  values: number[]; // numeric values
  height?: number;
  color?: string;
  strokeWidth?: number;
  maxValue?: number; // explicit max for y-axis
  targetValue?: number; // target/goal line
  targetColor?: string; // color of target line
  unit?: string; // label for y-axis (e.g., "g", "cal")
};

export default function LineChart({ 
  values, 
  height = 120, 
  color = '#4F46E5', 
  strokeWidth = 2, 
  maxValue, 
  targetValue,
  targetColor = '#FFD700',
  unit = '' 
}: Props) {
  if (!values || values.length === 0) return <View style={[styles.container, { height }]} />;

  const w = 300; // viewbox width
  const h = Math.max(80, height);
  const max = maxValue ?? Math.max(...values, 1);
  const padding = { left: 40, right: 10, top: 10, bottom: 10 };
  const graphW = w - padding.left - padding.right;
  const graphH = h - padding.top - padding.bottom;

  // map values to points in SVG coordinate space
  const points = values.map((v, i) => {
    const x = padding.left + (i / Math.max(1, values.length - 1)) * graphW;
    const y = padding.top + (1 - v / max) * graphH;
    return `${x},${y}`;
  });

  // Generate y-axis ticks
  const tickCount = 3;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    ticks.push({
      value: Math.round((max * (tickCount - i)) / tickCount),
      y: padding.top + (i / tickCount) * graphH,
    });
  }

  // Calculate target line position
  const targetY = targetValue !== undefined ? padding.top + (1 - targetValue / max) * graphH : null;

  return (
    <View style={[styles.container, { height: h }]}>
      <View style={styles.chartWrapper}>
        <View style={styles.yAxisLabels}>
          {ticks.map((tick, i) => (
            <ThemedText key={i} style={styles.yAxisLabel}>
              {tick.value}
            </ThemedText>
          ))}
        </View>
        <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {/* Y-axis */}
          <Line x1={padding.left} y1={padding.top} x2={padding.left} y2={h - padding.bottom} stroke="#666" strokeWidth="1" />
          
          {/* Grid lines and ticks */}
          {ticks.map((tick, i) => (
            <React.Fragment key={i}>
              <Line x1={padding.left - 5} y1={tick.y} x2={padding.left} y2={tick.y} stroke="#666" strokeWidth="1" />
              <Line x1={padding.left} y1={tick.y} x2={w - padding.right} y2={tick.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2,2" />
            </React.Fragment>
          ))}
          
          {/* Target line (if provided) */}
          {targetY !== null && (
            <Line 
              x1={padding.left} 
              y1={targetY} 
              x2={w - padding.right} 
              y2={targetY} 
              stroke={targetColor} 
              strokeWidth="1.5" 
              strokeDasharray="4,4"
              opacity="0.7"
            />
          )}
          
          {/* X-axis */}
          <Line x1={padding.left} y1={h - padding.bottom} x2={w - padding.right} y2={h - padding.bottom} stroke="#666" strokeWidth="1" />
          
          {/* Line */}
          <Polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Data points */}
          {values.map((v, i) => {
            const x = padding.left + (i / Math.max(1, values.length - 1)) * graphW;
            const y = padding.top + (1 - v / max) * graphH;
            return <Circle key={i} cx={x} cy={y} r={1.5} fill={color} />;
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxisLabels: {
    width: 35,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 5,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#999',
  },
});
