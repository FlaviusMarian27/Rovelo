import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { makeStyles, useTheme } from '@/context/theme';

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: { title: string; onPress: () => void };
};

export function EmptyState({ icon: Icon, title, text, action }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
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

const useStyles = makeStyles((colors) => ({
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
}));
