// Explore: toate locurile din jur pe hartă (din OpenStreetMap, prin backend), cu filtre pe tipuri
// și căutare după nume. Apeși un loc → Detalii sau Adaugă în traseu. Fără traseu activ,
// primul loc adăugat începe unul nou, al tău. Deschis din Edit route, pornește centrat pe rută.
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronRight, Plus, Route as RouteIcon, Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ExploreMap, type ExploreMapHandle } from '@/components/explore/explore-map';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useCity } from '@/context/city';
import { useRoute } from '@/context/route';
import { makeStyles, useTheme } from '@/context/theme';
import { PLACE_GROUPS, type PlaceGroup } from '@/data/place-kinds';
import { exploreNearby, searchPlaces } from '@/services/explore-api';
import { rememberPlaces } from '@/services/place-cache';
import type { Coord, Stop } from '@/types';
import { formatDistance, distanceMeters } from '@/utils/geo';

export default function ExploreScreen() {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const { city } = useCity();
  const { activeRoute, addStop } = useRoute();
  const params = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const map = useRef<ExploreMapHandle>(null);

  // De unde pornește harta: centrul rutei (din Edit), altfel centrul orașului
  const fromParams =
    params.lat && params.lon
      ? { latitude: Number(params.lat), longitude: Number(params.lon) }
      : null;
  const [center] = useState<Coord>(fromParams ?? city.coord);
  const area = useRef<{ center: Coord; radius: number }>({ center, radius: 1100 });

  const [group, setGroup] = useState<PlaceGroup | null>(null);
  const [places, setPlaces] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stop[] | null>(null);
  const request = useRef(0);

  const routeStops = activeRoute?.stops ?? [];
  const kinds = group ? PLACE_GROUPS.find((g) => g.id === group)!.kinds : [];

  async function load(c: Coord, r: number, k: string[]) {
    const id = ++request.current;
    setLoading(true);
    try {
      const found = await exploreNearby(c, r, k);
      if (id !== request.current) return; // a venit deja un răspuns mai nou
      rememberPlaces(found);
      setPlaces(found);
    } catch {
      // fără rețea: rămân locurile de dinainte
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  // Harta s-a oprit din mișcare → locurile din zona nouă (cu o mică pauză, să nu cerem la fiecare tresărire)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  function onAreaChange(c: Coord, r: number) {
    area.current = { center: c, radius: r };
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(c, r, kinds), 350);
  }

  // Alt filtru → reîncărcăm zona curentă
  useEffect(() => {
    load(area.current.center, area.current.radius, kinds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  // Venit din Edit route cu alt centru (tab-ul era deja deschis) → mutăm harta acolo
  useEffect(() => {
    if (fromParams) map.current?.focus(fromParams, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.lat, params.lon]);

  // Fără centru din rută: mutăm harta la tine, dacă ai dat deja voie la locație
  useEffect(() => {
    if (fromParams) return;
    Location.getForegroundPermissionsAsync()
      .then(async ({ granted }) => {
        if (!granted) return;
        const pos = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 });
        if (pos)
          map.current?.focus(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            15,
          );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Căutarea după nume
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(area.current.center, q);
        rememberPlaces(found);
        setResults(found);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function select(id: string | null) {
    setSelected(
      id ? (places.find((p) => p.id === id) ?? routeStops.find((s) => s.id === id) ?? null) : null,
    );
  }

  function pickResult(p: Stop) {
    Keyboard.dismiss();
    setQuery('');
    setResults(null);
    setPlaces((cur) => (cur.some((x) => x.id === p.id) ? cur : [...cur, p]));
    setSelected(p);
    map.current?.focus(p.coord, 17);
  }

  const inRoute = !!selected && routeStops.some((s) => s.id === selected.id);

  return (
    <View style={styles.screen}>
      <ExploreMap
        ref={map}
        center={center}
        places={places}
        routeStops={routeStops}
        selectedId={selected?.id ?? null}
        onSelect={select}
        onAreaChange={onAreaChange}
      />

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.search}>
          <Search size={20} color={colors.textSecondary} strokeWidth={1.75} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('explore.search')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            keyboardAppearance={scheme}
          />
          {loading && !query ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : !!query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityLabel={t('common.close')}>
              <X size={20} color={colors.textSecondary} strokeWidth={1.75} />
            </Pressable>
          ) : null}
        </View>

        {results ? (
          <View style={styles.results}>
            {results.length === 0 ? (
              <Text style={styles.empty}>{t('explore.noResults')}</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {results.map((p, i) => (
                  <Pressable
                    key={p.id}
                    onPress={() => pickResult(p)}
                    style={({ pressed }) => [
                      styles.result,
                      i < results.length - 1 && styles.resultBorder,
                      pressed && { backgroundColor: colors.surface },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.resultMeta} numberOfLines={1}>
                        {p.blurb} · {formatDistance(distanceMeters(area.current.center, p.coord))}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            <Chip label={t('explore.all')} selected={!group} onPress={() => setGroup(null)} />
            {PLACE_GROUPS.map((g) => (
              <Chip
                key={g.id}
                label={t(`explore.groups.${g.id}`)}
                icon={g.icon}
                selected={group === g.id}
                onPress={() => setGroup(group === g.id ? null : g.id)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      <View style={styles.bottom} pointerEvents="box-none">
        {selected ? (
          <View style={styles.card}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/explore/place/[id]', params: { id: selected.id } })
              }
              accessibilityRole="button"
              style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {selected.name}
                </Text>
                <Text style={styles.cardMeta}>
                  {selected.blurb ? `${selected.blurb} · ` : ''}
                  {t('place.visit', { min: selected.visitMinutes })}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </Pressable>
            <Button
              title={
                inRoute
                  ? t('place.inRoute')
                  : activeRoute
                    ? t('place.addToRoute')
                    : t('explore.startRoute')
              }
              icon={inRoute ? Check : Plus}
              disabled={inRoute}
              onPress={() => addStop(selected)}
            />
          </View>
        ) : (
          activeRoute && (
            <Pressable
              onPress={() => router.navigate('/route')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.routePill, pressed && { opacity: 0.85 }]}>
              <RouteIcon size={18} color={colors.onPrimary} strokeWidth={1.75} />
              <Text style={styles.routePillText}>
                {t('explore.yourRoute', { count: activeRoute.stops.length })}
              </Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.md },
  search: {
    marginTop: spacing.sm,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  chips: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.md },
  results: {
    marginTop: spacing.sm,
    maxHeight: 340,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 4,
  },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resultName: { fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.text },
  resultMeta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textSecondary },
  empty: {
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  bottom: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    alignItems: 'center',
  },
  card: {
    alignSelf: 'stretch',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardName: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  cardMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  routePillText: { fontFamily: fonts.semibold, fontSize: fontSize.sm + 1, color: colors.onPrimary },
}));
