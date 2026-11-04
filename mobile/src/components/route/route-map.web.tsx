// react-native-maps nu merge pe web. Variantă simplă (doar ca bundle-ul web să nu crape):
// desenează linia, pinii și poziția proiectate pe un dreptunghi.
import { useImperativeHandle, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';

import { colors } from '@/constants/theme';
import type { Coord, Route } from '@/types';

export type RouteMapHandle = {
  focusStop: (index: number) => void;
  centerOn: (c: Coord, zoom?: number) => void;
  fitRoute: () => void;
};

type Props = {
  route: Route;
  ref?: Ref<RouteMapHandle>;
  userPosition?: Coord | null;
  currentIndex?: number;
  edgePadding?: { top: number; right: number; bottom: number; left: number };
  onUserPan?: () => void;
};

export function RouteMap({ route, ref, userPosition, currentIndex, edgePadding }: Props) {
  useImperativeHandle(ref, () => ({ focusStop: () => {}, centerOn: () => {}, fitRoute: () => {} }));

  const W = 400;
  const H = edgePadding ? 800 : 240;
  const pad = edgePadding ? { t: 260, b: 220, x: 50 } : { t: 30, b: 30, x: 30 };
  const lats = route.path.map((c) => c.latitude);
  const lngs = route.path.map((c) => c.longitude);
  const [minLat, maxLat, minLng, maxLng] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
  const s = Math.min(
    (W - 2 * pad.x) / (maxLng - minLng || 1),
    (H - pad.t - pad.b) / (maxLat - minLat || 1),
  );
  const cy = pad.t + (H - pad.t - pad.b) / 2;
  const x = (lng: number) => W / 2 + (lng - (minLng + maxLng) / 2) * s;
  const y = (lat: number) => cy - (lat - (minLat + maxLat) / 2) * s;

  return (
    <View style={styles.wrap}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice">
        <Polyline
          points={route.path.map((c) => `${x(c.longitude)},${y(c.latitude)}`).join(' ')}
          fill="none"
          stroke={colors.primary}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {route.stops.map((st, i) => (
          <Circle
            key={st.id}
            cx={x(st.coord.longitude)}
            cy={y(st.coord.latitude)}
            r={currentIndex === i ? 16 : 13}
            fill={
              currentIndex !== undefined && i < currentIndex ? colors.textMuted : colors.primary
            }
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
        {userPosition && (
          <>
            <Circle
              cx={x(userPosition.longitude)}
              cy={y(userPosition.latitude)}
              r={18}
              fill={colors.userLocationHalo}
            />
            <Circle
              cx={x(userPosition.longitude)}
              cy={y(userPosition.latitude)}
              r={8}
              fill={colors.userLocation}
              stroke="#fff"
              strokeWidth={3}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface },
});
