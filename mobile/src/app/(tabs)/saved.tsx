// Saved routes — deocamdată stare goală; lista cu carduri vine la pasul ei.
import { router } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Saved routes</Text>
      <Text style={styles.sub}>Good walks are worth keeping.</Text>
      <EmptyState
        icon={Bookmark}
        title="Nothing saved yet"
        text="Save a route or a place you love and it will show up here."
        action={{ title: 'Plan a walk', onPress: () => router.navigate('/home') }}
      />
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
});
