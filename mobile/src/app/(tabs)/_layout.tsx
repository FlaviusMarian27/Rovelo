// Temporar: doar Home, ca să ai unde ajunge după login.
// La pasul următor punem cele 4 taburi (Home · Route · Saved · Profile).
import { Stack } from 'expo-router';

export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
