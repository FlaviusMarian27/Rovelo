import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  password?: boolean;
};

export function Input({ label, hint, error, password, style, ...rest }: Props) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <TextInput
          {...rest}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && hidden}
          autoCapitalize={password ? 'none' : rest.autoCapitalize}
          autoCorrect={password ? false : rest.autoCorrect}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}>
            {hidden ? (
              <Eye size={20} color={colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  fieldFocused: { borderColor: colors.borderFocus },
  fieldError: { borderColor: colors.error },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textSecondary },
  error: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.error },
});
