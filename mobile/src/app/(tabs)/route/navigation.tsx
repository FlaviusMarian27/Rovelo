// Live navigation: harta pe tot ecranul, poziția ta, "Stop X of N", cardul spre oprirea următoare.
// Poziția vine din GPS sau din modul demo (simulează mersul pe traseu, pentru test de acasă).
import { Redirect, router } from 'expo-router';
import {
  ArrowLeft,
  ArrowUp,
  Camera,
  Crosshair,
  Ellipsis,
  Flag,
  MapPinOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteMap, type RouteMapHandle } from '@/components/route/route-map';
import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import { useGpsPosition, useSimulatedPosition } from '@/hooks/use-position';
import { useWalkProgress } from '@/hooks/use-walk-progress';
import type { Route } from '@/types';
import { bearing, distanceMeters, formatDistance, formatMinutes } from '@/utils/geo';

const FAR_FROM_ROUTE_M = 3000; // mai departe de atât → îți propunem modul demo

export default function NavigationScreen() {
  const { activeRoute } = useRoute();
  // ex. după reload: fără traseu nu avem ce naviga
  if (!activeRoute) return <Redirect href="/route" />;
  return <Navigation route={activeRoute} />;
}

function Navigation({ route }: { route: Route }) {
  const [demo, setDemo] = useState(false);
  const [following, setFollowing] = useState(true);
  const mapRef = useRef<RouteMapHandle>(null);

  const gps = useGpsPosition(!demo);
  const simulated = useSimulatedPosition(route, demo);
  const position = demo ? simulated : gps.position;

  const walk = useWalkProgress(route, position);
  const far = !!position && distanceMeters(position, walk.target.coord) > FAR_FROM_ROUTE_M;

  // Harta te urmărește cât timp nu ai mutat-o tu (și ești lângă traseu).
  useEffect(() => {
    if (following && position && !far) mapRef.current?.centerOn(position, 16.5);
  }, [position, following, far]);

  const recenter = () => {
    setFollowing(true);
    if (position && !far) mapRef.current?.centerOn(position, 16.5);
    else mapRef.current?.fitRoute();
  };

  const openMenu = () =>
    Alert.alert(route.title, undefined, [
      {
        text: demo ? 'Use real GPS' : 'Simulate walk (demo)',
        onPress: () => setDemo((d) => !d),
      },
      { text: 'End route', style: 'destructive', onPress: () => router.back() },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const n = route.stops.length;
  const stopLabel = walk.phase === 'finished' ? 'Route complete' : `Stop ${walk.index + 1} of ${n}`;

  return (
    <View style={styles.screen}>
      <RouteMap
        ref={mapRef}
        route={route}
        userPosition={position}
        currentIndex={walk.phase === 'finished' ? n : walk.index}
        edgePadding={{ top: 220, right: 60, bottom: 200, left: 60 }}
        onUserPan={() => setFollowing(false)}
      />

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <RoundButton icon={ArrowLeft} label="Back" onPress={() => router.back()} />
          <View style={styles.pill}>
            <Text style={styles.pillText}>{stopLabel}</Text>
          </View>
          <RoundButton icon={Ellipsis} label="Route options" onPress={openMenu} />
        </View>

        {walk.phase !== 'finished' && (
          <NextStopCard route={route} walk={walk} hasPosition={!!position} demo={demo} />
        )}
      </SafeAreaView>

      <View style={styles.sideButtons} pointerEvents="box-none">
        <RoundButton icon={Crosshair} label="Center on me" onPress={recenter} />
        <Pressable
          onPress={() => Alert.alert('Scan a building', 'Coming next.')}
          accessibilityRole="button"
          accessibilityLabel="Scan a building"
          style={({ pressed }) => [styles.cameraButton, pressed && { opacity: 0.85 }]}>
          <Camera size={24} color={colors.onPrimary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={styles.bottom} pointerEvents="box-none">
        {renderBottomCard()}
      </View>
    </View>
  );

  function renderBottomCard(): ReactNode {
    if (walk.phase === 'finished') {
      return (
        <BottomCard icon={Flag} title="Nice walk!" text={`${n} stops · ${route.distanceKm} km`}>
          <Button title="Back to route" onPress={() => router.back()} />
        </BottomCard>
      );
    }
    if (walk.phase === 'arrived') {
      const nextStop = route.stops[walk.index + 1];
      return (
        <BottomCard
          title={`You're at ${walk.target.name}`}
          text={`${walk.target.blurb}. Stay about ${walk.target.visitMinutes} min.`}>
          <Button
            title={nextStop ? `Continue to ${nextStop.name}` : 'Finish route'}
            onPress={walk.next}
          />
        </BottomCard>
      );
    }
    if (!demo && (gps.status === 'denied' || gps.status === 'error')) {
      return (
        <BottomCard
          icon={MapPinOff}
          title="Location is off"
          text="Allow location to follow the route, or try it with a simulated walk.">
          <Button title="Simulate walk" onPress={() => setDemo(true)} />
        </BottomCard>
      );
    }
    if (!demo && far) {
      return (
        <BottomCard
          title="You're far from this route"
          text="Walk over to the first stop, or preview the route with a simulated walk.">
          <Button title="Simulate walk" variant="outline" onPress={() => setDemo(true)} />
        </BottomCard>
      );
    }
    return null;
  }
}

type Walk = ReturnType<typeof useWalkProgress>;

function NextStopCard({
  route,
  walk,
  hasPosition,
  demo,
}: {
  route: Route;
  walk: Walk;
  hasPosition: boolean;
  demo: boolean;
}) {
  const arrived = walk.phase === 'arrived';
  const after = route.stops[walk.index + 1];
  // Săgeata arată direcția spre oprire pe harta orientată spre nord.
  const angle =
    hasPosition && !arrived && walk.toTarget
      ? bearing(route.stops[Math.max(0, walk.index - 1)].coord, walk.target.coord)
      : 0;

  let title = `Head to ${walk.target.name}`;
  let sub = 'Finding your location…';
  if (hasPosition && walk.toTarget) {
    const { meters, walkMinutes } = walk.toTarget;
    // Departe de traseu, minutele de mers n-au sens ("118 h") → doar distanța.
    sub =
      meters > FAR_FROM_ROUTE_M
        ? `${formatDistance(meters)} away`
        : `${formatDistance(meters)} · ${formatMinutes(walkMinutes)}`;
  }
  if (arrived) {
    title = walk.target.name;
    sub = after ? `Next stop: ${after.name}` : 'Last stop';
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={{ transform: [{ rotate: `${angle}deg` }] }}>
          <ArrowUp size={22} color={colors.text} strokeWidth={2} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {demo && <Text style={styles.demoTag}>DEMO</Text>}
      </View>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  );
}

function BottomCard({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.card, styles.bottomCard]}>
      <View style={styles.cardRow}>
        {Icon && <Icon size={20} color={colors.text} strokeWidth={1.75} />}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardSub, { marginBottom: spacing.md }]}>{text}</Text>
      {children}
    </View>
  );
}

function RoundButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.round, pressed && { backgroundColor: colors.surface }]}>
      <Icon size={22} color={colors.text} strokeWidth={1.75} />
    </Pressable>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  overlay: { ...StyleSheet.absoluteFill, paddingHorizontal: spacing.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pill: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    ...shadow,
  },
  pillText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    ...shadow,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  cardTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  cardSub: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  demoTag: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  sideButtons: {
    position: 'absolute',
    right: spacing.md,
    bottom: 230,
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  bottom: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  bottomCard: { marginTop: 0 },
});
