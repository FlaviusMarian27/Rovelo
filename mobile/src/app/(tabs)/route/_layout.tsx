// Stack în tab-ul Route: Your route → Live navigation → Place story (pașii următori),
// ca bara de jos să rămână vizibilă.
import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function RouteLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
