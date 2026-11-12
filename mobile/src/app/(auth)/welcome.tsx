import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { touchPoint, useTransition } from '@/context/transition';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { continueAsGuest } = useSession();
  const { enter } = useTransition();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel={t('welcome.logo')}
        />
        <Text style={styles.name}>Rovelo</Text>
        <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
      </View>

      <View style={styles.actions}>
        <Button title={t('welcome.logIn')} onPress={() => router.push('/login')} />
        <Button
          title={t('welcome.createAccount')}
          variant="outline"
          onPress={() => router.push('/register')}
        />
        <Button
          title={t('welcome.guest')}
          variant="text"
          onPress={(e) => enter(touchPoint(e), continueAsGuest)}
        />
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
