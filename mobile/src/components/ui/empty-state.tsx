import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: { title: string; onPress: () => void };
};

export function EmptyState({ icon: Icon, title, text, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon size={28} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {action && (
        <View style={styles.action}>
          <Button title={action.title} onPress={action.onPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  text: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  action: { alignSelf: 'stretch', marginTop: spacing.lg },
});
