// Stack în tab-ul Profile: Profile → Edit profile (bara de jos rămâne vizibilă).
import { Stack } from 'expo-router';
import { useTheme } from '@/context/theme';

export default function ProfileLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
