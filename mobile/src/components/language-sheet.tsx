// Alegerea limbii: panou care urcă de jos, în stilul aplicației (în loc de Alert-ul sistemului).
// Limba curentă e bifată; o limbă nouă apare aici automat din LANGUAGES.
import { Check, Languages } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { LANGUAGES, setLanguage } from '@/i18n';

export function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')}>
        {/* apăsarea pe panou nu trebuie să-l închidă */}
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.icon}>
              <Languages size={20} color={colors.primary} strokeWidth={1.75} />
            </View>
            <Text style={styles.title}>{t('profile.language')}</Text>
          </View>

          <View style={styles.list}>
            {LANGUAGES.map((l, i) => {
              const selected = i18n.language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    setLanguage(l.code);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.row,
                    i < LANGUAGES.length - 1 && styles.rowBorder,
                    selected && styles.rowSelected,
                    pressed && !selected && styles.rowPressed,
                  ]}>
                  <Text style={styles.code}>{l.code.toUpperCase()}</Text>
                  <Text style={[styles.label, selected && styles.labelSelected]}>{l.label}</Text>
                  {selected && <Check size={20} color={colors.primary} strokeWidth={2} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.6 }]}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 4,
    marginBottom: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
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
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowSelected: { backgroundColor: colors.primarySoft },
  rowPressed: { backgroundColor: colors.surface },
  code: {
    width: 28,
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  label: { flex: 1, fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.text },
  labelSelected: { color: colors.primary },
  cancel: { alignItems: 'center', justifyContent: 'center', height: 52, marginTop: spacing.sm },
  cancelText: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.textSecondary },
});
