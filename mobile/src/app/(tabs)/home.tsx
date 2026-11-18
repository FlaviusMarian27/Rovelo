// Home = Preferences: orașul, cât timp ai, ce te interesează, de unde pornești.
import { router } from 'expo-router';
import {
  ChevronDown,
  Coffee,
  History,
  Landmark,
  LocateFixed,
  MapPin,
  Palette,
  Sparkles,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CityPicker } from '@/components/city-picker';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Segmented } from '@/components/ui/segmented';
import { fonts, fontSize, spacing } from '@/constants/theme';
import { useCity } from '@/context/city';
import { useRoute } from '@/context/route';
import { makeStyles, useTheme } from '@/context/theme';
import { durations, interests } from '@/data/mock';
import type { Duration, Interest } from '@/types';

const interestIcons: Record<Interest, LucideIcon> = {
  architecture: Landmark,
  history: History,
  coffee: Coffee,
  parks: Trees,
  art: Palette,
  food: UtensilsCrossed,
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const { generateRoute, generating } = useRoute();
  const { city, detecting } = useCity();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [duration, setDuration] = useState<Duration>('2h');
  const [selected, setSelected] = useState<Interest[]>(['architecture', 'history']);
  const toggle = (id: Interest) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function onGenerate() {
    // Pornim mereu de la tine (GPS); fără GPS sau dacă ești în alt oraș, din centrul orașului ales
    const route = await generateRoute({
      city,
      duration,
      interests: selected,
      start: { id: 'gps', label: t('start.gps'), isGps: true },
    });
    if (route) router.navigate('/route');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>rovelo</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('home.cityLabel', { city: city.name })}
          style={({ pressed }) => [styles.city, pressed && { opacity: 0.6 }]}>
          <MapPin size={16} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.cityText}>{detecting ? t('home.locating') : city.name}</Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t('home.eyebrow')}</Text>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Segmented options={durations} value={duration} onChange={setDuration} />

        <Text style={styles.section}>{t('home.interests')}</Text>
        <View style={styles.chips}>
          {interests.map((i) => (
            <Chip
              key={i.id}
              label={t(`interests.${i.id}`)}
              icon={interestIcons[i.id]}
              selected={selected.includes(i.id)}
              onPress={() => toggle(i.id)}
            />
          ))}
        </View>

        <View style={styles.fromRow}>
          <LocateFixed size={16} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.fromText}>{t('home.fromLocation')}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Text style={styles.note}>
          {selected.length ? t('home.noteReady') : t('home.noteNoInterest')}
        </Text>
        <Button
          title={generating ? t('home.generating') : t('home.generate')}
          icon={Sparkles}
          onPress={onGenerate}
          loading={generating}
          disabled={!selected.length}
        />
      </View>

      <CityPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logo: { fontFamily: fonts.semibold, fontSize: 26, color: colors.text, letterSpacing: -0.5 },
  city: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cityText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xl,
    lineHeight: 34,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  fromText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  section: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md + 1,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md - 2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2 },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  note: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
}));
