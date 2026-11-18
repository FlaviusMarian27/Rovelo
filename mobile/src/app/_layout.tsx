import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/i18n'; // traducerile, înainte de orice ecran
import { AnimatedSplash } from '@/components/animated-splash';
import { lightColors } from '@/constants/theme';
import { CityProvider } from '@/context/city';
import { RouteProvider } from '@/context/route';
import { SessionProvider, useSession } from '@/context/session';
import { ThemeProvider, useTheme } from '@/context/theme';
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
        {/* Tema depinde de cont (salvată pe server), deci stă în interiorul sesiunii */}
        <ThemeProvider>
          <ThemedStatusBar overSplash={!splashDone} />
          <CityProvider>
            <TransitionProvider>
              <RootStack />
            </TransitionProvider>
          </CityProvider>
          {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
        </ThemeProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

// Barele sistemului (sus: ceas/baterie, jos pe Android: butoanele) urmează tema aplicației,
// nu pe a telefonului: conținut închis pe light, deschis pe dark; alb peste splash-ul roșu.
// Pe Android, bara de jos devine astfel albă pe light (în loc de gri) și închisă pe dark.
function ThemedStatusBar({ overSplash }: { overSplash: boolean }) {
  const { scheme, colors } = useTheme();
  const content = overSplash || scheme === 'dark' ? 'light' : 'dark';

  // Fundalul ferestrei native. Bara de jos e transparentă (edge-to-edge), deci prin ea se vede
  // fundalul ăsta; altfel rămâne cel al telefonului (gri/negru când telefonul e pe dark).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <>
      <StatusBar style={content} />
      <NavigationBar style={content} />
    </>
  );
}

// Stack.Protected: ecranele de auth există doar când nu ești logat, taburile doar când ești.
// Când se schimbă user-ul, expo-router te mută singur pe ecranul potrivit.
function RootStack() {
  const { colors } = useTheme();
  const { user, ready } = useSession();

  // Cât verificăm token-ul salvat: rămâne roșul splash-ului, ca să nu clipească Welcome.
  if (!ready) return <View style={{ flex: 1, backgroundColor: lightColors.primary }} />;

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
