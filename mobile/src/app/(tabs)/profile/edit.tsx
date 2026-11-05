// Edit profile: nume și email. Folosește același schelet ca Log in / Create account.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthForm } from '@/components/ui/auth-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, fonts, fontSize } from '@/constants/theme';
import { useSession } from '@/context/session';
import { isValidEmail } from '@/utils/validation';

type Errors = { name?: string; email?: string; form?: string };

export default function EditProfileScreen() {
  const { user, updateProfile } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const changed = name.trim() !== user?.name || email.trim().toLowerCase() !== user?.email;

  async function onSave() {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await updateProfile(name, email);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    router.back();
  }

  return (
    <AuthForm title="Edit profile" subtitle="How you show up in Rovelo." footer={null}>
      <Input
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
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
        returnKeyType="done"
        onSubmitEditing={() => onSave()}
        error={errors.email}
      />

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Button title="Save changes" onPress={onSave} loading={loading} disabled={!changed} />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error },
});
