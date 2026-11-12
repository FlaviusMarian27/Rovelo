// Edit profile: prenume, nume, nickname, email și o scurtă descriere.
// Poza de profil vine mai târziu; până atunci avatarul arată inițialele.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthForm } from '@/components/ui/auth-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import type { ProfileInput } from '@/types';
import { BIO_MAX, isValidEmail, isValidNickname } from '@/utils/validation';

type Errors = Partial<Record<keyof ProfileInput | 'form', string>>;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { user, updateProfile } = useSession();
  const initial: ProfileInput = {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    nickname: user?.nickname ?? '',
    bio: user?.bio ?? '',
    email: user?.email ?? '',
  };
  const [form, setForm] = useState<ProfileInput>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof ProfileInput) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const changed = (Object.keys(initial) as (keyof ProfileInput)[]).some(
    (k) => form[k].trim() !== initial[k],
  );
  const optional = (label: string) => `${label} (${t('profile.optional')})`;

  async function onSave() {
    const next: Errors = {};
    if (!form.firstName.trim()) next.firstName = t('auth.errFirstName');
    if (!form.lastName.trim()) next.lastName = t('auth.errLastName');
    if (!isValidNickname(form.nickname)) next.nickname = t('profile.errNickname');
    if (!isValidEmail(form.email)) next.email = t('auth.errEmail');
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const res = await updateProfile(form);
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    router.back();
  }

  return (
    <AuthForm title={t('profile.edit')} subtitle={t('profile.editSubtitle')} footer={null}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label={t('auth.firstName')}
            placeholder={t('auth.firstNamePlaceholder')}
            value={form.firstName}
            onChangeText={set('firstName')}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            error={errors.firstName}
          />
        </View>
        <View style={styles.half}>
          <Input
            label={t('auth.lastName')}
            placeholder={t('auth.lastNamePlaceholder')}
            value={form.lastName}
            onChangeText={set('lastName')}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            error={errors.lastName}
          />
        </View>
      </View>
      <Input
        label={optional(t('profile.nickname'))}
        placeholder={t('profile.nicknamePlaceholder')}
        prefix="@"
        value={form.nickname}
        onChangeText={(v) => set('nickname')(v.replace(/\s/g, '').toLowerCase())}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        hint={t('profile.nicknameHint')}
        error={errors.nickname}
      />
      <Input
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        value={form.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={errors.email}
      />
      <Input
        label={optional(t('profile.bio'))}
        placeholder={t('profile.bioPlaceholder')}
        value={form.bio}
        onChangeText={set('bio')}
        multiline
        maxLength={BIO_MAX}
        hint={`${form.bio.length}/${BIO_MAX}`}
        error={errors.bio}
      />

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Button
        title={t('profile.saveChanges')}
        onPress={onSave}
        loading={loading}
        disabled={!changed}
      />
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.error },
});
