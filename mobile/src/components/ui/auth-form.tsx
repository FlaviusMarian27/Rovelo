// Schelet comun pentru Log in și Create account:
// back, titlu, subtitlu, câmpuri, iar jos linkul spre celălalt ecran.
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer: ReactNode;
}>;

export function AuthForm({ title, subtitle, footer, children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BackButton />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.form}>{children}</View>
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  header: { marginTop: spacing.lg, marginBottom: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.regular, fontSize: fontSize.xl, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.textSecondary },
  form: { gap: spacing.lg - 4 },
  footer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingTop: spacing.xl },
});
