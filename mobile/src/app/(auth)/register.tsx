import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthForm } from '@/components/ui/auth-form';
import { Button } from '@/components/ui/button';
import { FooterLink } from '@/components/ui/footer-link';
import { Input } from '@/components/ui/input';
import { colors, fonts, fontSize } from '@/constants/theme';
import { useSession } from '@/context/session';
import { isValidEmail, MIN_PASSWORD } from '@/utils/validation';

type Errors = { name?: string; email?: string; password?: string; form?: string };

export default function RegisterScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email.';
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await signUp(name, email, password);
    setLoading(false);
    if (!res.ok) setErrors({ form: res.error });
  }

  return (
    <AuthForm
      title="Create account"
      subtitle="Make every walk your own."
      footer={<FooterLink text="Already have an account?" link="Log in" href="/login" />}>
      <Input
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        error={errors.name}
      />
      <Input
        label="Email"
        placeholder="you@example.com"
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
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        password
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        hint={`Use at least ${MIN_PASSWORD} characters.`}
        error={errors.password}
      />

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Button title="Create account" onPress={onSubmit} loading={loading} />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error },
});
