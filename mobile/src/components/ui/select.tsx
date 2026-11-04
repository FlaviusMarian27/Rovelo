// Dropdown simplu: câmpul din Figma ("My location (GPS)") + listă care se deschide dedesubt.
import { Check, ChevronDown, Crosshair, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import type { StartPoint } from '@/types';

type Props = {
  options: StartPoint[];
  value: StartPoint;
  onChange: (v: StartPoint) => void;
};

export function StartSelect({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const Icon = value.isGps ? Crosshair : MapPin;

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.field, open && styles.fieldOpen]}>
        <Icon size={20} color={colors.textSecondary} strokeWidth={1.75} />
        <Text style={styles.value}>{value.label}</Text>
        <ChevronDown
          size={20}
          color={colors.textSecondary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {open && (
        <View style={styles.menu}>
          {options.map((opt) => {
            const selected = opt.id === value.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <Text style={[styles.optionText, selected && styles.optionSelected]}>
                  {opt.label}
                </Text>
                {selected && <Check size={18} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  fieldOpen: { borderColor: colors.borderFocus },
  value: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text },
  menu: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  option: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  optionPressed: { backgroundColor: colors.surface },
  optionText: { fontFamily: fonts.regular, fontSize: fontSize.md, color: colors.text },
  optionSelected: { fontFamily: fonts.medium, color: colors.primary },
});
