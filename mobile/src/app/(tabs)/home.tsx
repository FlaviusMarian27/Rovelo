// Home = Preferences: cât timp ai, ce te interesează, de unde pornești.
import { router } from 'expo-router';
import {
  ChevronDown,
  Coffee,
  History,
  Landmark,
  MapPin,
  Palette,
  Sparkles,
  Trees,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Segmented } from '@/components/ui/segmented';
import { StartSelect } from '@/components/ui/select';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import { currentCity, durations, interests, startPoints } from '@/data/mock';
import type { Duration, Interest, StartPoint } from '@/types';

const interestIcons: Record<Interest, LucideIcon> = {
  architecture: Landmark,
  history: History,
  coffee: Coffee,
  parks: Trees,
  art: Palette,
};

export default function HomeScreen() {
  const { generateRoute, generating } = useRoute();
  const [duration, setDuration] = useState<Duration>('2h');
  const [selected, setSelected] = useState<Interest[]>(['architecture', 'history']);
  const [start, setStart] = useState<StartPoint>(startPoints[0]);

  const toggle = (id: Interest) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function onGenerate() {
    await generateRoute({ duration, interests: selected, start });
    router.navigate('/route');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>rovelo</Text>
        <View style={styles.city}>
          <MapPin size={16} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.cityText}>{currentCity}</Text>
          <ChevronDown size={16} color={colors.textSecondary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>A WALK, YOUR WAY</Text>
        <Text style={styles.title}>How much time do you have?</Text>
        <Segmented options={durations} value={duration} onChange={setDuration} />

        <Text style={styles.section}>What draws you in?</Text>
        <View style={styles.chips}>
          {interests.map((i) => (
            <Chip
              key={i.id}
              label={i.label}
              icon={interestIcons[i.id]}
              selected={selected.includes(i.id)}
              onPress={() => toggle(i.id)}
            />
          ))}
        </View>

        <Text style={styles.section}>Where shall we start?</Text>
        <StartSelect options={startPoints} value={start} onChange={setStart} />
      </ScrollView>

      <View style={styles.bottom}>
        <Text style={styles.note}>
          {selected.length
            ? 'A local perspective, thoughtfully planned by AI.'
            : 'Pick at least one thing you enjoy.'}
        </Text>
        <Button
          title={generating ? 'Planning your walk…' : 'Generate route'}
          icon={Sparkles}
          onPress={onGenerate}
          loading={generating}
          disabled={!selected.length}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
