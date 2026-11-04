import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSize, radius } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'primary' && pressed && styles.primaryPressed,
        variant === 'outline' && styles.outline,
        variant === 'outline' && pressed && styles.outlinePressed,
        variant === 'text' && styles.text,
        variant === 'text' && pressed && styles.textPressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.label, variant === 'primary' && styles.labelPrimary]}>{title}</Text>
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
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.background },
  outlinePressed: { backgroundColor: colors.surface },
  text: { height: 40 },
  textPressed: { opacity: 0.6 },
  disabled: { opacity: 0.6 },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  labelPrimary: { color: colors.onPrimary },
});
