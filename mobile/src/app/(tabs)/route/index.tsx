// Fără traseu: "No route yet". Cu traseu: harta + lista de opriri, în ordinea de parcurgere.
import { router } from 'expo-router';
import { ChevronRight, Footprints, Navigation } from 'lucide-react-native';
import { Fragment, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteMap, type RouteMapHandle } from '@/components/route/route-map';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import type { Leg, Stop } from '@/types';
import { formatMinutes } from '@/utils/geo';

export default function RouteScreen() {
  const { activeRoute, walk } = useRoute();
  const mapRef = useRef<RouteMapHandle>(null);
  const [focused, setFocused] = useState<number | null>(null);

  if (!activeRoute) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          icon={Footprints}
          title="No route yet"
          text="Tell us how much time you have and what you enjoy. We'll plan the walk."
          action={{ title: 'Plan a walk', onPress: () => router.navigate('/home') }}
        />
      </SafeAreaView>
    );
  }

  const r = activeRoute;
  const inProgress =
    walk?.routeId === r.id && walk.phase !== 'finished' && (walk.index > 0 || !!walk.startedAt);
  const onStopPress = (i: number) => {
    setFocused(i);
    mapRef.current?.focusStop(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.header}>Your route</Text>

      <View style={styles.map}>
        {/* key: harta se reface când se schimbă ruta (alt număr de opriri, alt cadru) */}
        <RouteMap key={r.id} ref={mapRef} route={r} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{r.title}</Text>
        <Text style={styles.meta}>
          {formatMinutes(r.totalMinutes)} · {r.distanceKm} km · {r.stops.length} stops · {r.pace}
        </Text>

        <View style={styles.stops}>
          {r.stops.map((s, i) => (
            <Fragment key={s.id}>
              <StopRow stop={s} index={i} active={focused === i} onPress={() => onStopPress(i)} />
              {r.legs[i] && <LegRow leg={r.legs[i]} />}
            </Fragment>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button
          title={inProgress ? `Resume route · stop ${walk!.index + 1}` : 'Start route'}
          icon={Navigation}
          onPress={() => router.push('/route/navigation')}
        />
      </View>
    </SafeAreaView>
  );
}

type StopRowProps = { stop: Stop; index: number; active: boolean; onPress: () => void };

function StopRow({ stop, index, active, onPress }: StopRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Stop ${index + 1}: ${stop.name}, show on map`}
      style={({ pressed }) => [styles.stop, (pressed || active) && styles.stopActive]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
      <View style={styles.stopText}>
        <Text style={styles.stopName}>{stop.name}</Text>
        <Text style={styles.stopBlurb}>{stop.blurb}</Text>
      </View>
      <Text style={styles.stopMin}>{stop.visitMinutes} min</Text>
      <Pressable
        onPress={() => router.push({ pathname: '/route/place/[id]', params: { id: stop.id } })}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Read the story of ${stop.name}`}
        style={styles.storyButton}>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

function LegRow({ leg }: { leg: Leg }) {
  return (
    <View style={styles.leg}>
      <View style={styles.legLine} />
      <Footprints size={14} color={colors.textMuted} strokeWidth={1.75} />
      <Text style={styles.legText}>
        {leg.walkMinutes} min walk · {leg.meters} m
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.lg - 2,
    color: colors.text,
    paddingVertical: spacing.md - 4,
  },
  map: { height: 250 },
  content: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.xl - 4, color: colors.text },
  meta: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stops: { marginTop: spacing.md },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: radius.md,
  },
  stopActive: { backgroundColor: colors.surface },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.onPrimary },
  stopText: { flex: 1 },
  stopName: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  stopBlurb: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs + 1,
    color: colors.textSecondary,
  },
  stopMin: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  storyButton: { marginLeft: -4, paddingVertical: 4 },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 15, // linia sub centrul badge-ului
    height: 26,
  },
  legLine: {
    width: 2,
    height: '100%',
    backgroundColor: colors.border,
    marginRight: spacing.md - 4,
  },
  legText: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
});
