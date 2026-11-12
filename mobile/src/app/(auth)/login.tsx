import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, type GestureResponderEvent } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthForm } from '@/components/ui/auth-form';
import { Button } from '@/components/ui/button';
import { FooterLink } from '@/components/ui/footer-link';
import { Input } from '@/components/ui/input';
import { colors, fonts, fontSize } from '@/constants/theme';
import { useSession } from '@/context/session';
import { touchPoint, useTransition } from '@/context/transition';
import { isValidEmail } from '@/utils/validation';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, startSession } = useSession();
  const { enter } = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e?: GestureResponderEvent) {
    const origin = touchPoint(e); // citit înainte de await
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = t('auth.errEmail');
    if (!password) next.password = t('auth.errPassword');
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    // Animația acoperă ecranul, apoi pornește sesiunea → Stack.Protected te duce în app.
    enter(origin, () => startSession(res.user, res.token));
  }

  return (
    <AuthForm
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <FooterLink
          text={t('auth.login.footer')}
          link={t('auth.login.footerLink')}
          href="/register"
        />
      }>
      <Input
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        error={errors.email}
      />
      <Input
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        password
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
        error={errors.password}
      />

      <Pressable
        style={styles.forgot}
        hitSlop={8}
        onPress={() => Alert.alert(t('auth.login.forgotTitle'), t('auth.login.forgotText'))}>
        <Text style={styles.forgotText}>{t('auth.login.forgot')}</Text>
      </Pressable>

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Button title={t('auth.login.submit')} onPress={onSubmit} loading={loading} />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.primary },
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error },
});
