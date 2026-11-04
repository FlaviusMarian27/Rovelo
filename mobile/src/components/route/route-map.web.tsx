// react-native-maps nu merge pe web. Variantă simplă (doar ca bundle-ul web să nu crape):
// desenează linia și pinii proiectați pe un dreptunghi.
import { useImperativeHandle, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';

import { colors } from '@/constants/theme';
import type { Route } from '@/types';

export type RouteMapHandle = { focusStop: (index: number) => void };

export function RouteMap({ route, ref }: { route: Route; ref?: Ref<RouteMapHandle> }) {
  useImperativeHandle(ref, () => ({ focusStop: () => {} }));

  const W = 400;
  const H = 240;
  const pad = 30;
  const lats = route.path.map((c) => c.latitude);
  const lngs = route.path.map((c) => c.longitude);
  const [minLat, maxLat, minLng, maxLng] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
  const sx = (W - 2 * pad) / (maxLng - minLng || 1);
  const sy = (H - 2 * pad) / (maxLat - minLat || 1);
  const s = Math.min(sx, sy);
  const x = (lng: number) => W / 2 + (lng - (minLng + maxLng) / 2) * s;
  const y = (lat: number) => H / 2 - (lat - (minLat + maxLat) / 2) * s;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Polyline
          points={route.path.map((c) => `${x(c.longitude)},${y(c.latitude)}`).join(' ')}
          fill="none"
          stroke={colors.primary}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {route.stops.map((st) => (
          <Circle
            key={st.id}
            cx={x(st.coord.longitude)}
            cy={y(st.coord.latitude)}
            r={13}
            fill={colors.primary}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
        {route.stops.map((st, i) => (
          <SvgText
            key={`n${st.id}`}
            x={x(st.coord.longitude)}
            y={y(st.coord.latitude) + 4.5}
            fontSize={13}
            fontWeight="600"
            fill="#fff"
            textAnchor="middle">
            {String(i + 1)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface },
});
