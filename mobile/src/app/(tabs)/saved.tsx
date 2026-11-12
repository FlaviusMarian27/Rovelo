// Saved: rutele salvate (din Your route, iconița cu semn de carte) — pe server, pe contul tău —
// și locurile salvate (din Place story), tot pe server.
// Tragi în jos ca să reîncarci lista de pe server. Chip-urile de sus filtrează: All / Routes / Places.
import { router } from 'expo-router';
import { Bookmark, ChevronRight, Landmark } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RouteThumb } from '@/components/route/route-thumb';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import type { Route } from '@/types';
import { formatMinutes } from '@/utils/geo';

export default function SavedScreen() {
  const { t } = useTranslation();
  const { savedPlaces, savedRoutes, savedLoading, reloadSaved, openRoute, activeRoute, walk } =
    useRoute();
  const places = savedPlaces; // datele vin salvate cu tot cu poveste
  const empty = places.length === 0 && savedRoutes.length === 0;
  const [filter, setFilter] = useState<'all' | 'routes' | 'places'>('all');
  const showRoutes = filter !== 'places';
  const showPlaces = filter !== 'routes';
  const showHeadings = filter === 'all'; // la un singur tip, chip-ul ales spune deja ce vezi

  function open(route: Route) {
    const walking =
      !!walk && walk.routeId === activeRoute?.id && walk.phase !== 'finished' && !!walk.startedAt;
    const go = () => {
      openRoute(route);
      router.navigate('/route');
    };
    if (walking && activeRoute?.id !== route.id) {
      Alert.alert(t('saved.switchTitle'), t('saved.switchText'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('saved.open'), onPress: go },
      ]);
    } else go();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('saved.title')}</Text>
      <Text style={styles.sub}>{t('saved.subtitle')}</Text>

      {empty && savedLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : empty ? (
        <EmptyState
          icon={Bookmark}
          title={t('saved.emptyTitle')}
          text={t('saved.emptyText')}
          action={{ title: t('common.planWalk'), onPress: () => router.navigate('/home') }}
        />
      ) : (
        <>
          <View style={styles.filters}>
            <Chip
              label={t('saved.all', { count: savedRoutes.length + places.length })}
              selected={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label={t('saved.routes', { count: savedRoutes.length })}
              selected={filter === 'routes'}
              onPress={() => setFilter('routes')}
            />
            <Chip
              label={t('saved.places', { count: places.length })}
              selected={filter === 'places'}
              onPress={() => setFilter('places')}
            />
          </View>
          <ScrollView
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={savedLoading}
                onRefresh={reloadSaved}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }>
            {showHeadings && savedRoutes.length > 0 && (
              <Text style={styles.section}>{t('saved.routes', { count: savedRoutes.length })}</Text>
            )}
            {showRoutes && savedRoutes.length === 0 && filter === 'routes' && (
              <Text style={styles.none}>{t('saved.noRoutes')}</Text>
            )}
            {showRoutes &&
              savedRoutes.map((r) => (
                <Card
                  key={r.id}
                  onPress={() => open(r)}
                  thumb={<RouteThumb route={r} />}
                  title={r.title}
                  meta={`${formatMinutes(r.totalMinutes)} · ${t('common.stops', { count: r.stops.length })}`}
                  tags={r.tags?.join(' · ')}
                />
              ))}

            {showHeadings && places.length > 0 && (
              <Text style={[styles.section, savedRoutes.length > 0 && { marginTop: spacing.md }]}>
                {t('saved.places', { count: places.length })}
              </Text>
            )}
            {showPlaces && places.length === 0 && filter === 'places' && (
              <Text style={styles.none}>{t('saved.noPlaces')}</Text>
            )}
            {showPlaces &&
              places.map((p) => (
                <Card
                  key={p.id}
                  onPress={() =>
                    router.push({ pathname: '/route/place/[id]', params: { id: p.id } })
                  }
                  thumb={
                    <View style={styles.placeThumb}>
                      <Landmark size={26} color={colors.primary} strokeWidth={1.5} />
                    </View>
                  }
                  title={p.name}
                  meta={t('place.visit', { min: p.visitMinutes })}
                  tags={p.story?.category}
                />
              ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function Card({
  onPress,
  thumb,
  title,
  meta,
  tags,
}: {
  onPress: () => void;
  thumb: React.ReactNode;
  title: string;
  meta: string;
  tags?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surface }]}>
      {thumb}
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.cardMeta}>{meta}</Text>
        {!!tags && (
          <Text style={styles.cardTags} numberOfLines={1}>
            {tags}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  title: {
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.semibold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  sub: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  list: { padding: spacing.lg, gap: spacing.md - 4 },
  none: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  loading: { marginTop: spacing.xxl },
  section: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    padding: spacing.md - 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  cardMeta: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardTags: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});
