// Placeholder ca să testezi fluxul de auth. Devine ecranul Preferences.
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function HomeScreen() {
  const { user, signOut } = useSession();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>Hi, {user?.name}</Text>
        <Text style={styles.sub}>{user?.isGuest ? 'Guest mode' : user?.email}</Text>
      </View>
      <Button title="Log out" variant="outline" onPress={signOut} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.regular, fontSize: fontSize.xl, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.textSecondary },
});
