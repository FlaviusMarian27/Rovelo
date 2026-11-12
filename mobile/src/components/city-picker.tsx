// Alegerea orașului: căutare (fără diacritice), "Use my current location" și lista de orașe.
import { Check, Crosshair, MapPin, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { useCity } from '@/context/city';
import { cities, normalize } from '@/data/cities';

export function CityPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { city, setCity, detectCity, detecting } = useCity();
  const [query, setQuery] = useState('');

  const q = normalize(query);
  const results = q ? cities.filter((c) => normalize(c.name).includes(q)) : cities;

  async function useLocation() {
    const res = await detectCity(true);
    if (res === 'ok') return close();
    Alert.alert(
      res === 'denied' ? 'Location is off' : "Couldn't find your city",
      res === 'denied'
        ? 'Allow location for Rovelo in your phone settings, or pick a city from the list.'
        : 'Pick a city from the list instead.',
    );
  }

  function close() {
    setQuery('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a city</Text>
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search a city"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <Pressable
          onPress={useLocation}
          disabled={detecting}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, styles.gpsRow, pressed && styles.pressed]}>
          {detecting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Crosshair size={20} color={colors.primary} strokeWidth={1.75} />
          )}
          <Text style={[styles.rowText, { color: colors.primary }]}>Use my current location</Text>
        </Pressable>

        <FlatList
          data={results}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>No city found. Try "Use my current location".</Text>
          }
          renderItem={({ item }) => {
            const selected = item.id === city.id;
            return (
              <Pressable
                onPress={() => {
                  setCity(item);
                  close();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <MapPin size={20} color={colors.textSecondary} strokeWidth={1.75} />
                <Text style={[styles.rowText, selected && styles.selected]}>{item.name}</Text>
                <Text style={styles.country}>{item.country}</Text>
                {selected && <Check size={18} color={colors.primary} />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.lg, color: colors.text },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 4,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  gpsRow: {
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface },
  rowText: { flex: 1, fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.text },
  selected: { color: colors.primary },
  country: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  empty: {
    padding: spacing.lg,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
