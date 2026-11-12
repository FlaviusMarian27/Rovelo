import { router } from 'expo-router';
import {
  ChevronRight,
  Languages,
  LogOut,
  Pencil,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { LanguageSheet } from '@/components/language-sheet';
import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useTransition } from '@/context/transition';
import { LANGUAGES } from '@/i18n';
import { fullName, initials } from '@/utils/user';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut: endSession, deleteAccount } = useSession();
  const { exit } = useTransition();
  const [languageOpen, setLanguageOpen] = useState(false);
  if (!user) return null;

  const signOut = () => exit(endSession);
  const confirmDelete = () =>
    Alert.alert(t('profile.deleteTitle'), t('profile.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const res = await deleteAccount();
          if (res.ok) exit(endSession);
          else Alert.alert(t('profile.deleteFailed'), res.error);
        },
      },
    ]);

  const currentLanguage = LANGUAGES.find((l) => l.code === i18n.language)?.label ?? 'English';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user)}</Text>
          </View>
          <Text style={styles.name}>{fullName(user)}</Text>
          {!!user.nickname && <Text style={styles.nickname}>@{user.nickname}</Text>}
          <Text style={styles.email}>{user.isGuest ? t('profile.guestSub') : user.email}</Text>
          {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={[styles.list, styles.languageList]}>
          <Row
            icon={Languages}
            label={t('profile.language')}
            value={currentLanguage}
            onPress={() => setLanguageOpen(true)}
            last
          />
        </View>

        {user.isGuest ? (
          <View style={styles.guest}>
            <Text style={styles.guestText}>{t('profile.guestText')}</Text>
            <Button title={t('profile.guestButton')} onPress={signOut} />
          </View>
        ) : (
          <View style={styles.list}>
            <Row
              icon={Pencil}
              label={t('profile.edit')}
              onPress={() => router.push('/profile/edit')}
            />
            <Row
              icon={SlidersHorizontal}
              label={t('profile.preferences')}
              onPress={() => router.navigate('/home')}
            />
            <Row icon={LogOut} label={t('profile.logOut')} onPress={signOut} />
            <Row icon={Trash2} label={t('profile.delete')} danger onPress={confirmDelete} last />
          </View>
        )}
      </ScrollView>

      <LanguageSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} />
    </SafeAreaView>
  );
}

type RowProps = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  value?: string; // ex. limba curentă, afișată în dreapta
  danger?: boolean;
  last?: boolean;
};

function Row({ icon: Icon, label, value, onPress, danger, last }: RowProps) {
  const color = danger ? colors.error : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}>
      <Icon size={20} color={color} strokeWidth={1.75} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {!!value && <Text style={styles.rowValue}>{value}</Text>}
      {!danger && <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  languageList: { marginBottom: spacing.md },
  rowValue: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textSecondary },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.xl, color: colors.text },
  card: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 30, color: colors.primary },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  email: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  nickname: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  bio: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.text,
  },
  list: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { backgroundColor: colors.surface },
  rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: fontSize.md },
  guest: { gap: spacing.md },
  guestText: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
