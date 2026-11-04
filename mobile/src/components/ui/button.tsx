import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading,
  disabled,
}: Props) {
  const isDisabled = disabled || loading;
  const fg = variant === 'primary' ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'primary' && pressed && styles.primaryPressed,
        variant === 'outline' && styles.outline,
        variant === 'outline' && pressed && styles.outlinePressed,
        variant === 'text' && styles.text,
        variant === 'text' && pressed && styles.textPressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {Icon && <Icon size={20} color={fg} strokeWidth={2} />}
          <Text style={[styles.label, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.background },
  outlinePressed: { backgroundColor: colors.surface },
  text: { height: 40 },
  textPressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.md },
});
