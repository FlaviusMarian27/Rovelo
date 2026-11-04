// Saved: deocamdată locurile salvate din Place story (în memorie).
// Rutele salvate (cardurile din Figma) vin când avem backend-ul.
import { router } from 'expo-router';
import { Bookmark, ChevronRight, Landmark } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useRoute } from '@/context/route';
import { findPlace, placeStories } from '@/data/mock';

export default function SavedScreen() {
  const { savedPlaces } = useRoute();
  const places = savedPlaces.map(findPlace).filter((p) => !!p);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Saved</Text>
      <Text style={styles.sub}>Good walks are worth keeping.</Text>

      {places.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          text="Save a route or a place you love and it will show up here."
          action={{ title: 'Plan a walk', onPress: () => router.navigate('/home') }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.section}>Places · {places.length}</Text>
          {places.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/route/place/[id]', params: { id: p.id } })}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.card,
                pressed && { backgroundColor: colors.surface },
              ]}>
              <View style={styles.thumb}>
                <Landmark size={24} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardMeta}>{placeStories[p.id]?.category}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
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
  list: { padding: spacing.lg, gap: spacing.md - 4 },
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
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  cardMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs + 1,
    color: colors.textSecondary,
  },
});
