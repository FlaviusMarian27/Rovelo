// Tranzițiile dintre auth și aplicație.
//
// enter(origin, commit): un cerc roșu crește din punctul atins până acoperă ecranul,
//   apoi rulează commit (pornește sesiunea → expo-router schimbă ecranele dedesubt),
//   pinul sare pe roșu, iar cercul se strânge în tab-ul Home.
// exit(commit): fade alb scurt, commit (Log out), fade înapoi.
import { createContext, useContext, useRef, useState, type PropsWithChildren } from 'react';
import {
  Keyboard,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/constants/theme';

export type Point = { x: number; y: number };

// Punctul atins pe ecran (de unde pornește cercul). Fără atingere (ex. tasta Go) → centru.
export const touchPoint = (e?: GestureResponderEvent): Point | undefined =>
  e ? { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } : undefined;

type Transition = {
  enter: (origin: Point | undefined, commit: () => void) => void;
  exit: (commit: () => void) => void;
};

const TransitionContext = createContext<Transition | null>(null);

const TAB_BAR_HEIGHT = 49; // înălțimea standard a barei de taburi (fără zona sigură)
const PIN_SIZE = 72;

// Momentele animației de intrare (ms)
const COVER = 420;
const HOLD = 500; // cât stă roșul cu pinul, timp în care se schimbă ecranele dedesubt
const REVEAL = 460;
const PIN_IN = 320;
const PIN_OUT = 160;

export function TransitionProvider({ children }: PropsWithChildren) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<'idle' | 'enter' | 'exit'>('idle');
  const busy = useRef(false);

  // Raza care acoperă ecranul din orice punct.
  const R = Math.hypot(W, H);

  const cx = useSharedValue(W / 2);
  const cy = useSharedValue(H / 2);
  const scale = useSharedValue(0);
  const pinIn = useSharedValue(0); // 0 → 1 (cu overshoot peste 1 la aterizare)
  const pinOut = useSharedValue(0); // 0 → 1 dispare
  const fade = useSharedValue(0);

  const done = () => {
    busy.current = false;
    setMode('idle');
  };

  function enter(origin: Point | undefined, commit: () => void) {
    if (busy.current) return;
    Keyboard.dismiss();

    if (reduceMotion) {
      commit();
      return;
    }

    busy.current = true;
    const from = origin ?? { x: W / 2, y: H / 2 };
    const homeTab = { x: W / 8, y: H - insets.bottom - TAB_BAR_HEIGHT / 2 };

    cx.value = from.x;
    cy.value = from.y;
    scale.value = 0;
    pinIn.value = 0;
    pinOut.value = 0;
    setMode('enter');

    const ease = Easing.inOut(Easing.cubic);

    // 1. Cercul acoperă ecranul → commit (schimbăm sesiunea, nu se vede).
    // 3. După HOLD, se strânge spre tab-ul Home și dezvăluie aplicația.
    // (O singură secvență: dacă am da scale.value de două ori, a doua o anulează pe prima.)
    scale.value = withSequence(
      withTiming(1, { duration: COVER, easing: Easing.in(Easing.quad) }, (fin) => {
        if (fin) scheduleOnRN(commit);
      }),
      withDelay(
        HOLD,
        withTiming(0, { duration: REVEAL, easing: ease }, (fin) => {
          if (fin) scheduleOnRN(done);
        }),
      ),
    );
    cx.value = withDelay(COVER + HOLD, withTiming(homeTab.x, { duration: REVEAL, easing: ease }));
    cy.value = withDelay(COVER + HOLD, withTiming(homeTab.y, { duration: REVEAL, easing: ease }));

    // 2. Pinul cade cu un mic overshoot, apoi dispare chiar înainte de reveal.
    const pinStart = COVER - 60;
    pinIn.value = withDelay(
      pinStart,
      withTiming(1, { duration: PIN_IN, easing: Easing.out(Easing.back(2.2)) }),
    );
    pinOut.value = withDelay(COVER + HOLD - PIN_OUT, withTiming(1, { duration: PIN_OUT }));
  }

  function exit(commit: () => void) {
    if (busy.current) return;
    if (reduceMotion) {
      commit();
      return;
    }
    busy.current = true;
    fade.value = 0;
    setMode('exit');
    fade.value = withSequence(
      withTiming(1, { duration: 180 }, (fin) => {
        if (fin) scheduleOnRN(commit);
      }),
      withDelay(
        120,
        withTiming(0, { duration: 260 }, (fin) => {
          if (fin) scheduleOnRN(done);
        }),
      ),
    );
  }

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cx.value - R }, { translateY: cy.value - R }, { scale: scale.value }],
  }));

  const pinStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pinIn.value * 2) * (1 - pinOut.value),
    transform: [{ translateY: (1 - pinIn.value) * -40 }, { scale: 1 - pinOut.value * 0.3 }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <TransitionContext.Provider value={{ enter, exit }}>
      {children}

      {mode === 'enter' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <Animated.View
            style={[styles.circle, { width: R * 2, height: R * 2, borderRadius: R }, circleStyle]}
          />
          <View style={styles.center} pointerEvents="none">
            <Animated.Image
              source={require('@/assets/images/splash/pin-solo.png')}
              style={[styles.pin, pinStyle]}
            />
          </View>
        </View>
      )}

      {mode === 'exit' && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.white, fadeStyle]} />
      )}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used inside TransitionProvider');
  return ctx;
}

const styles = StyleSheet.create({
  circle: { position: 'absolute', left: 0, top: 0, backgroundColor: colors.primary },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pin: { width: PIN_SIZE, height: PIN_SIZE },
  white: { backgroundColor: colors.background },
});
