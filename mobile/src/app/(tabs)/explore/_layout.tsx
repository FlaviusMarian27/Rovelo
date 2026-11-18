// Stack în tab-ul Explore: harta → Place story,
// ca bara de jos să rămână vizibilă și Back să te întoarcă pe hartă.
import { Stack } from 'expo-router';
import { useTheme } from '@/context/theme';

export default function ExploreLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
