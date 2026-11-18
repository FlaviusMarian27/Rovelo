// Stack în tab-ul Route: Your route → Live navigation → Place story (pașii următori),
// ca bara de jos să rămână vizibilă.
import { Stack } from 'expo-router';
import { useTheme } from '@/context/theme';

export default function RouteLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
