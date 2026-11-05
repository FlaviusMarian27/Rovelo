// Mini-hartă pentru carduri: forma traseului (linie + puncte), fără hartă reală.
// Ieftină de randat într-o listă și merge pe orice platformă (react-native-svg).
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { colors, radius } from '@/constants/theme';
import type { Route } from '@/types';

export function RouteThumb({ route, size = 72 }: { route: Route; size?: number }) {
  const pad = 12;
  const lats = route.path.map((c) => c.latitude);
  const lngs = route.path.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // longitudinea "se strânge" la latitudinea Timișoarei → corectăm ca forma să nu fie turtită
  const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const s = (size - 2 * pad) / Math.max((maxLng - minLng) * k, maxLat - minLat, 1e-6);
  const x = (lng: number) => size / 2 + (lng - (minLng + maxLng) / 2) * k * s;
  const y = (lat: number) => size / 2 - (lat - (minLat + maxLat) / 2) * s;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Polyline
          points={route.path.map((c) => `${x(c.longitude)},${y(c.latitude)}`).join(' ')}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {route.stops.map((st) => (
          <Circle
            key={st.id}
            cx={x(st.coord.longitude)}
            cy={y(st.coord.latitude)}
            r={3.5}
            fill={colors.primary}
            stroke={colors.onPrimary}
            strokeWidth={1.5}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, backgroundColor: colors.primarySoft, overflow: 'hidden' },
});
