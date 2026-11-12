// Place story: poza (cea făcută de tine, dacă vii din Scan), povestea locului,
// "Add to route" și "Save". Stă în tab-ul Route, deci Back te duce de unde ai venit.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Landmark,
  MapPin,
  Plus,
  Share2,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import { findPlace, placeStories } from '@/data/mock';

export default function PlaceScreen() {
  const { t } = useTranslation();
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();
  const { activeRoute, addStop, isPlaceSaved, toggleSavedPlace } = useRoute();
  const place = findPlace(id);
  const story = placeStories[id];

  if (!place || !story) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon={Landmark}
          title={t('place.notFound')}
          text={t('place.notFoundText')}
          action={{ title: t('common.goBack'), onPress: () => router.back() }}
        />
      </SafeAreaView>
    );
  }

  const inRoute = !!activeRoute?.stops.some((s) => s.id === place.id);
  const saved = isPlaceSaved(place.id);

  function onAdd() {
    const res = addStop(place!);
    if (res === 'no-route') {
      Alert.alert(t('place.noWalk'), t('place.noWalkText'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.planWalk'), onPress: () => router.navigate('/home') },
      ]);
    }
  }

  const onShare = () =>
    Share.share({ message: `${place.name} (${story.area})\n\n${story.story}\n\n— via Rovelo` });

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }} bounces={false}>
        <View style={styles.hero}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Landmark size={48} color={colors.textMuted} strokeWidth={1.25} />
            </View>
          )}
          <SafeAreaView edges={['top']} style={styles.heroBar}>
            <HeroButton icon={ArrowLeft} label={t('common.back')} onPress={() => router.back()} />
            <HeroButton icon={Share2} label={t('place.share')} onPress={onShare} />
          </SafeAreaView>
          <View style={styles.visitBadge}>
            <Clock size={14} color={colors.text} strokeWidth={2} />
            <Text style={styles.visitText}>{t('place.visit', { min: place.visitMinutes })}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{story.category.toUpperCase()}</Text>
          <Text style={styles.title}>{place.name}</Text>
          <View style={styles.areaRow}>
            <MapPin size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.area}>{story.area}</Text>
          </View>

          <Text style={styles.story}>{story.story}</Text>

          <View style={styles.tipRow}>
            <Sun size={18} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.tip}>{story.tip}</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.actions}>
        <View style={styles.addButton}>
          <Button
            title={inRoute ? t('place.inRoute') : t('place.addToRoute')}
            icon={inRoute ? Check : Plus}
            disabled={inRoute}
            onPress={onAdd}
          />
        </View>
        <Button
          title={saved ? t('place.saved') : t('place.save')}
          icon={saved ? BookmarkCheck : Bookmark}
          variant="outline"
          onPress={() => toggleSavedPlace({ ...place, story })}
        />
      </SafeAreaView>
    </View>
  );
}

function HeroButton({
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
      hitSlop={8}
      style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.7 }]}>
      <Icon size={22} color={colors.text} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { height: 330, backgroundColor: colors.surface },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitBadge: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md - 4,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  visitText: { fontFamily: fonts.medium, fontSize: fontSize.xs + 1, color: colors.text },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  category: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  title: {
    marginTop: spacing.sm,
    fontFamily: fonts.semibold,
    fontSize: fontSize.xl,
    lineHeight: 34,
    color: colors.text,
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  area: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  story: {
    marginTop: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 25,
    color: colors.textSecondary,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  tip: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    gap: spacing.md - 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  addButton: { flex: 1 },
});
