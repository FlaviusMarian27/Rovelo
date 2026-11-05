import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplash } from '@/components/animated-splash';
import { colors } from '@/constants/theme';
import { RouteProvider } from '@/context/route';
import { SessionProvider, useSession } from '@/context/session';
import { TransitionProvider } from '@/context/transition';

// Splash-ul nativ rămâne până îl ascunde AnimatedSplash (după ce s-au încărcat fonturile).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [splashDone, setSplashDone] = useState(false);

  if (!fontsLoaded && !fontError) return null;

  return (
    // Necesar pentru gesturi (ex. tragerea opririlor pe Your route)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <StatusBar style={splashDone ? 'dark' : 'light'} />
        <TransitionProvider>
          <RootStack />
        </TransitionProvider>
        {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

// Stack.Protected: ecranele de auth există doar când nu ești logat, taburile doar când ești.
// Când se schimbă user-ul, expo-router te mută singur pe ecranul potrivit.
function RootStack() {
  const { user } = useSession();

  // key = user → la Log out / alt cont, traseul activ se resetează.
  return (
    <RouteProvider key={user?.id ?? 'signed-out'}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" />
          {/* Camera: full-screen, peste taburi */}
          <Stack.Screen
            name="scan"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
        </Stack.Protected>
      </Stack>
    </RouteProvider>
  );
}
