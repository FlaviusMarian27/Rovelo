// react-native-maps nu merge pe web: variantă simplă, punctele proiectate în jurul centrului
// (doar ca să se poată testa Explore în browser).
import { useEffect, useImperativeHandle, useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fonts } from '@/constants/theme';
import { makeStyles } from '@/context/theme';
import type { Coord, Stop } from '@/types';

export type ExploreMapHandle = { focus: (c: Coord, zoom?: number) => void };

type Props = {
  ref?: Ref<ExploreMapHandle>;
  center: Coord;
  places: Stop[];
  routeStops: Stop[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAreaChange: (center: Coord, radiusMeters: number) => void;
};

const RADIUS_M = 1100;

export function ExploreMap({
  ref,
  center,
  places,
  routeStops,
  selectedId,
  onSelect,
  onAreaChange,
}: Props) {
  const styles = useStyles();
  const { width, height } = useWindowDimensions();
  const [c, setC] = useState(center);
  useImperativeHandle(ref, () => ({ focus: (p) => setC(p) }));
  useEffect(() => {
    onAreaChange(c, RADIUS_M);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.latitude, c.longitude]);

  const mPerPx = (RADIUS_M * 2) / width;
  const x = (p: Coord) => width / 2 + ((p.longitude - c.longitude) * 77_800) / mPerPx;
  const y = (p: Coord) => height / 2 - ((p.latitude - c.latitude) * 111_320) / mPerPx;
  const inRoute = new Set(routeStops.map((s) => s.id));

  return (
    <Pressable style={styles.wrap} onPress={() => onSelect(null)}>
      {places
        .filter((p) => !inRoute.has(p.id))
        .map((p) => {
          const size = p.id === selectedId ? 22 : 14;
          return (
            <Pressable
              key={p.id}
              accessibilityLabel={p.name}
              onPress={() => onSelect(p.id)}
              style={[
                styles.dot,
                {
                  left: x(p.coord) - size / 2,
                  top: y(p.coord) - size / 2,
                  width: size,
                  height: size,
                },
              ]}
            />
          );
        })}
      {routeStops.map((s, i) => (
        <Pressable
          key={s.id}
          accessibilityLabel={s.name}
          onPress={() => onSelect(s.id)}
          style={[styles.pin, { left: x(s.coord) - 13, top: y(s.coord) - 13 }]}>
          <Text style={styles.pinText}>{i + 1}</Text>
        </Pressable>
      ))}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: colors.surface, overflow: 'hidden' },
  dot: {
    position: 'absolute',
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.onPrimary,
  },
  pin: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.background },
}));
