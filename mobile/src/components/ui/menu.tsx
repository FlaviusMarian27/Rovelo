// Meniu mic, ancorat sus-dreapta (pentru butonul "⋯"). Se închide la tap în afară.
import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';

export type MenuItem = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
};

type Props = { visible: boolean; onClose: () => void; items: MenuItem[]; top?: number };

export function Menu({ visible, onClose, items, top = 64 }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel={t('common.close')}>
        <View style={[styles.menu, { top: insets.top + top }]}>
          {items.map(({ label, icon: Icon, onPress, danger }, i) => {
            const color = danger ? colors.error : colors.text;
            return (
              <Pressable
                key={label}
                onPress={() => {
                  onClose();
                  onPress();
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => [
                  styles.item,
                  i < items.length - 1 && styles.itemBorder,
                  pressed && { backgroundColor: colors.surface },
                ]}>
                <Icon size={18} color={color} strokeWidth={1.75} />
                <Text style={[styles.label, { color }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    right: spacing.md,
    minWidth: 230,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  item: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 4,
    paddingHorizontal: spacing.md,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontFamily: fonts.medium, fontSize: fontSize.sm + 1 },
});
