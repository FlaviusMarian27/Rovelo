// Fără traseu: "No route yet". Cu traseu: lista de opriri (harta vine la pasul următor).
import { router } from 'expo-router';
import { Footprints, Navigation } from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import type { Stop } from '@/types';

export default function RouteScreen() {
  const { activeRoute } = useRoute();

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
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.header}>Your route</Text>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{r.title}</Text>
        <Text style={styles.meta}>
          {r.duration === '1h' ? '1 hour' : r.duration === '2h' ? '2 hours' : '3+ hours'} ·{' '}
          {r.distanceKm} km · {r.stops.length} stops · {r.pace}
        </Text>
        <View style={styles.stops}>
          {r.stops.map((s, i) => (
            <StopRow key={s.id} stop={s} index={i + 1} />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottom}>
        <Button
          title="Start route"
          icon={Navigation}
          onPress={() => Alert.alert('Start route', 'Live navigation comes next.')}
        />
      </View>
    </SafeAreaView>
  );
}

function StopRow({ stop, index }: { stop: Stop; index: number }) {
  return (
    <View style={styles.stop}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{index}</Text>
      </View>
      <View style={styles.stopText}>
        <Text style={styles.stopName}>{stop.name}</Text>
        <Text style={styles.stopBlurb}>{stop.blurb}</Text>
      </View>
      <Text style={styles.stopMin}>{stop.minutes} min</Text>
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
    paddingVertical: spacing.md,
  },
  content: { padding: spacing.lg },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.xl - 4, color: colors.text },
  meta: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stops: { marginTop: spacing.lg, gap: spacing.lg - 4 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2 },
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
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
});
