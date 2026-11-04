import {
  ChevronRight,
  LogOut,
  Pencil,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const soon = (what: string) => () => Alert.alert(what, 'Coming soon.');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.isGuest ? 'Exploring as a guest' : user.email}</Text>
        </View>

        {user.isGuest ? (
          <View style={styles.guest}>
            <Text style={styles.guestText}>
              Create an account to save routes and keep your preferences.
            </Text>
            <Button title="Log in or create account" onPress={signOut} />
          </View>
        ) : (
          <View style={styles.list}>
            <Row icon={Pencil} label="Edit profile" onPress={soon('Edit profile')} />
            <Row icon={SlidersHorizontal} label="Preferences" onPress={soon('Preferences')} />
            <Row icon={LogOut} label="Log out" onPress={signOut} />
            <Row
              icon={Trash2}
              label="Delete account"
              danger
              onPress={soon('Delete account')}
              last
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type RowProps = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
};

function Row({ icon: Icon, label, onPress, danger, last }: RowProps) {
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
      {!danger && <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
