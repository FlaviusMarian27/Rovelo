import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { AuthForm } from '@/components/ui/auth-form';
import { Button } from '@/components/ui/button';
import { FooterLink } from '@/components/ui/footer-link';
import { Input } from '@/components/ui/input';
import { colors, fonts, fontSize } from '@/constants/theme';
import { useSession } from '@/context/session';
import { isValidEmail } from '@/utils/validation';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    // La succes, Stack.Protected te duce singur în app.
    if (!res.ok) setErrors({ form: res.error });
  }

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Your next walk starts here."
      footer={<FooterLink text="New to Rovelo?" link="Create account" href="/register" />}>
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
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        password
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        error={errors.password}
      />

      <Pressable
        style={styles.forgot}
        hitSlop={8}
        onPress={() => Alert.alert('Forgot password', 'Password reset comes with the backend.')}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Button title="Log in" onPress={onSubmit} loading={loading} />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.primary },
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error },
});
