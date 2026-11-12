// Your route: harta + lista de opriri, în ordinea de parcurgere.
// Edit: tragi de mâner ca să schimbi ordinea sau scoți opriri; harta și timpii se recalculează pe loc.
// Ordinea o alege cine creează ruta → aplicația doar arată cât costă schimbarea față de sugestie.
import { router } from 'expo-router';
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Footprints,
  GripVertical,
  Navigation,
  RotateCcw,
  Trash2,
} from 'lucide-react-native';
import { Fragment, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RouteMap, type RouteMapHandle } from '@/components/route/route-map';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import type { Leg, Route, Stop } from '@/types';
import { formatMinutes } from '@/utils/geo';

export default function RouteScreen() {
  const { t } = useTranslation();
  const { activeRoute, walk, suggestedRoute, isRouteSaved, toggleSavedRoute } = useRoute();
  const mapRef = useRef<RouteMapHandle>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  if (!activeRoute) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          icon={Footprints}
          title={t('route.emptyTitle')}
          text={t('route.emptyText')}
          action={{ title: t('common.planWalk'), onPress: () => router.navigate('/home') }}
        />
      </SafeAreaView>
    );
  }

  const r = activeRoute;
  const inProgress =
    walk?.routeId === r.id && walk.phase !== 'finished' && (walk.index > 0 || !!walk.startedAt);
  const saved = isRouteSaved(r.id);
  const onStopPress = (i: number) => {
    setFocused(i);
    mapRef.current?.focusStop(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => toggleSavedRoute(r)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={saved ? t('route.unsaveRoute') : t('route.saveRoute')}
          style={styles.headerSide}>
          {saved ? (
            <BookmarkCheck size={22} color={colors.primary} strokeWidth={1.75} />
          ) : (
            <Bookmark size={22} color={colors.text} strokeWidth={1.75} />
          )}
        </Pressable>
        <Text style={styles.header}>{editing ? t('route.editTitle') : t('route.title')}</Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          {!inProgress && (
            <Pressable
              onPress={() => setEditing((e) => !e)}
              hitSlop={10}
              accessibilityRole="button">
              <Text style={styles.headerAction}>
                {editing ? t('common.done') : t('common.edit')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.map}>
        {/* key: harta se reface când se schimbă ruta (altă ordine, alt număr de opriri) */}
        <RouteMap key={r.id} ref={mapRef} route={r} />
      </View>

      {editing ? (
        <EditStops route={r} suggested={suggestedRoute} onDone={() => setEditing(false)} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <RouteSummary route={r} />
            <View style={styles.stops}>
              {r.stops.map((s, i) => (
                <Fragment key={s.id}>
                  <StopRow
                    stop={s}
                    index={i}
                    active={focused === i}
                    onPress={() => onStopPress(i)}
                  />
                  {r.legs[i] && <LegRow leg={r.legs[i]} />}
                </Fragment>
              ))}
            </View>
          </ScrollView>

          <View style={styles.bottom}>
            <Button
              title={inProgress ? t('route.resume', { n: walk!.index + 1 }) : t('route.start')}
              icon={Navigation}
              onPress={() => router.push('/route/navigation')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function RouteSummary({ route: r }: { route: Route }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.title}>{r.title}</Text>
      <Text style={styles.meta}>
        {formatMinutes(r.totalMinutes)} · {r.distanceKm} km ·{' '}
        {t('common.stops', { count: r.stops.length })} · {r.pace}
      </Text>
    </>
  );
}

// ---------- Edit: reordonare prin tragere + ștergere ----------

function EditStops({
  route: r,
  suggested,
  onDone,
}: {
  route: Route;
  suggested: Route | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { setStops, resetToSuggested } = useRoute();
  const changed = !!suggested && suggested.id !== r.id;
  const diff = suggested ? r.totalMinutes - suggested.totalMinutes : 0;
  const diffText =
    diff === 0
      ? t('route.diffSame')
      : t(diff > 0 ? 'route.diffMore' : 'route.diffLess', { min: Math.abs(diff) });

  return (
    <>
      <ReorderableList
        data={r.stops}
        keyExtractor={(s) => s.id}
        onReorder={({ from, to }) => setStops(reorderItems(r.stops, from, to))}
        renderItem={({ item, index }) => (
          <EditStopRow
            stop={item}
            index={index}
            canRemove={r.stops.length > 1}
            onRemove={() => setStops(r.stops.filter((s) => s.id !== item.id))}
          />
        )}
        ListHeaderComponent={
          <View style={styles.editHeader}>
            <RouteSummary route={r} />
            <Text style={styles.hint}>{t('route.hint')}</Text>
          </View>
        }
        contentContainerStyle={styles.editList}
        style={styles.flex}
      />

      <View style={styles.bottom}>
        {changed && (
          <View style={styles.diffRow}>
            <Text style={[styles.diffText, diff > 0 && styles.diffWorse]}>{diffText}</Text>
            <Pressable
              onPress={resetToSuggested}
              hitSlop={8}
              accessibilityRole="button"
              style={styles.reset}>
              <RotateCcw size={14} color={colors.primary} />
              <Text style={styles.resetText}>{t('route.reset')}</Text>
            </Pressable>
          </View>
        )}
        <Button title={t('common.done')} onPress={onDone} />
      </View>
    </>
  );
}

function EditStopRow({
  stop,
  index,
  canRemove,
  onRemove,
}: {
  stop: Stop;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const drag = useReorderableDrag();
  return (
    <View style={styles.editRow}>
      <Pressable
        onPressIn={drag}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t('route.drag', { name: stop.name })}
        style={styles.handle}>
        <GripVertical size={20} color={colors.textMuted} />
      </Pressable>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
      <View style={styles.stopText}>
        <Text style={styles.stopName} numberOfLines={1}>
          {stop.name}
        </Text>
        <Text style={styles.stopBlurb}>{t('route.visit', { min: stop.visitMinutes })}</Text>
      </View>
      {canRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('route.remove', { name: stop.name })}>
          <Trash2 size={18} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>
      )}
    </View>
  );
}

// ---------- Vizualizare ----------

type StopRowProps = { stop: Stop; index: number; active: boolean; onPress: () => void };

function StopRow({ stop, index, active, onPress }: StopRowProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('route.stopLabel', { n: index + 1, name: stop.name })}
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
        accessibilityLabel={t('route.story', { name: stop.name })}
        style={styles.storyButton}>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

function LegRow({ leg }: { leg: Leg }) {
  const { t } = useTranslation();
  return (
    <View style={styles.leg}>
      <View style={styles.legLine} />
      <Footprints size={14} color={colors.textMuted} strokeWidth={1.75} />
      <Text style={styles.legText}>{t('route.walk', { min: leg.walkMinutes, m: leg.meters })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 4,
  },
  headerSide: { width: 60 },
  header: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.lg - 2,
    color: colors.text,
  },
  headerAction: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.primary },
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
  editHeader: { paddingBottom: spacing.md },
  hint: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  editList: { padding: spacing.lg, paddingBottom: spacing.md },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 4,
    height: 64,
    paddingHorizontal: spacing.md - 4,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  handle: { paddingVertical: spacing.sm },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm + 2,
  },
  diffRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  diffText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.textSecondary },
  diffWorse: { color: colors.text },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetText: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.primary },
});
