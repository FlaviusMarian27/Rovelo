import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function WelcomeScreen() {
  const { continueAsGuest } = useSession();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel="Rovelo logo"
        />
        <Text style={styles.name}>Rovelo</Text>
        <Text style={styles.tagline}>A walk, your way</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Log in" onPress={() => router.push('/login')} />
        <Button title="Create account" variant="outline" onPress={() => router.push('/register')} />
        <Button title="Continue as guest" variant="text" onPress={continueAsGuest} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  name: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  tagline: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.md - 4 },
});
