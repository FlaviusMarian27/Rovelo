import { Tabs } from 'expo-router';
import { Bookmark, House, Route, User, type LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, fonts } from '@/constants/theme';

const icon =
  (Icon: LucideIcon) =>
  ({ color }: { color: ColorValue }) => <Icon size={24} color={String(color)} strokeWidth={1.75} />;

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="home" options={{ title: t('tabs.home'), tabBarIcon: icon(House) }} />
      <Tabs.Screen name="route" options={{ title: t('tabs.route'), tabBarIcon: icon(Route) }} />
      <Tabs.Screen name="saved" options={{ title: t('tabs.saved'), tabBarIcon: icon(Bookmark) }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: icon(User) }} />
    </Tabs>
  );
}
