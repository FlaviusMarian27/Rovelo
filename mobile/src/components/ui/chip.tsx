import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';

import { fonts, fontSize, radius, spacing } from '@/constants/theme';
import { makeStyles, useTheme } from '@/context/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
};

export function Chip({ label, selected, onPress, icon: Icon }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}>
      {Icon && <Icon size={18} color={fg} strokeWidth={1.75} />}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  chip: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.surface },
  label: { fontFamily: fonts.medium, fontSize: fontSize.sm + 1 },
}));
