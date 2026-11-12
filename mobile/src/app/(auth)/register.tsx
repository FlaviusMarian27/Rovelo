import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthForm } from '@/components/ui/auth-form';
import { Button } from '@/components/ui/button';
import { FooterLink } from '@/components/ui/footer-link';
import { Input } from '@/components/ui/input';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { touchPoint, useTransition } from '@/context/transition';
import { isValidEmail, MIN_PASSWORD } from '@/utils/validation';

type Errors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  form?: string;
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp, startSession } = useSession();
  const { enter } = useTransition();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e?: GestureResponderEvent) {
    const origin = touchPoint(e);
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = t('auth.errFirstName');
    if (!lastName.trim()) next.lastName = t('auth.errLastName');
    if (!isValidEmail(email)) next.email = t('auth.errEmail');
    if (password.length < MIN_PASSWORD) next.password = t('auth.minChars', { count: MIN_PASSWORD });
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await signUp(firstName, lastName, email, password);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    enter(origin, () => startSession(res.user, res.token));
  }

  return (
    <AuthForm
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <FooterLink
          text={t('auth.register.footer')}
          link={t('auth.register.footerLink')}
          href="/login"
        />
      }>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label={t('auth.firstName')}
            placeholder={t('auth.firstNamePlaceholder')}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            error={errors.firstName}
          />
        </View>
        <View style={styles.half}>
          <Input
            label={t('auth.lastName')}
            placeholder={t('auth.lastNamePlaceholder')}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="next"
            error={errors.lastName}
          />
        </View>
      </View>
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
        placeholder={t('auth.newPasswordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        password
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
        hint={t('auth.minChars', { count: MIN_PASSWORD })}
        error={errors.password}
      />

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Button title={t('auth.register.submit')} onPress={onSubmit} loading={loading} />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error },
});
