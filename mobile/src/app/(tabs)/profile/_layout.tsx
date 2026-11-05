// Stack în tab-ul Profile: Profile → Edit profile (bara de jos rămâne vizibilă).
import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
