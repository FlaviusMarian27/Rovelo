// Animația de intrare: pornește exact de unde rămâne splash-ul nativ (roșu + "R"),
// apoi pașii apar unul câte unul, pinul cade la destinație și ecranul se deschide.
// Straturile din assets/images/splash/ au aceeași pânză, deci se suprapun perfect.
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors } from '@/constants/theme';

const SIZE = 140; // egal cu imageWidth din app.json (expo-splash-screen)

const layers = {
  r: require('@/assets/images/splash/r.png'),
  pin: require('@/assets/images/splash/pin.png'),
  steps: [
    require('@/assets/images/splash/step-1.png'),
    require('@/assets/images/splash/step-2.png'),
    require('@/assets/images/splash/step-3.png'),
  ],
};

// Momentele animației (ms)
const STEP_START = 150;
const STEP_GAP = 170;
const PIN_START = 650;
const EXIT_START = 1300;
const EXIT_DURATION = 400;

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = useState(false);

  const step1 = useSharedValue(0);
  const step2 = useSharedValue(0);
  const step3 = useSharedValue(0);
  const pin = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (!started) return;

    const finish = (done?: boolean) => {
      'worklet';
      if (done) scheduleOnRN(onFinish);
    };

    // Cu "Reduce motion" activ: fără mișcare, doar un fade scurt.
    if (reduceMotion) {
      step1.value = step2.value = step3.value = pin.value = 1;
      exit.value = withDelay(400, withTiming(1, { duration: 250 }, finish));
      return;
    }

    [step1, step2, step3].forEach((s, i) => {
      s.value = withDelay(
        STEP_START + i * STEP_GAP,
        withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      );
    });
    pin.value = withDelay(PIN_START, withSpring(1, { damping: 9, stiffness: 170, mass: 0.8 }));
    exit.value = withDelay(
      EXIT_START,
      withTiming(1, { duration: EXIT_DURATION, easing: Easing.inOut(Easing.cubic) }, finish),
    );
    // shared values sunt stabile; rulează o singură dată după layout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + exit.value * 0.2 }] }));
  const pinStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pin.value * 2),
    transform: [{ translateY: (1 - pin.value) * -70 }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      pointerEvents="none"
      onLayout={() => {
        // Ascundem splash-ul nativ abia când overlay-ul identic e pe ecran → fără flicker.
        SplashScreen.hideAsync().finally(() => setStarted(true));
      }}>
      <Animated.View style={[styles.mark, markStyle]}>
        <Animated.Image source={layers.r} style={styles.layer} />
        <Step source={layers.steps[0]} progress={step1} />
        <Step source={layers.steps[1]} progress={step2} />
        <Step source={layers.steps[2]} progress={step3} />
        <Animated.Image source={layers.pin} style={[styles.layer, pinStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

function Step({ source, progress }: { source: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 4 }],
  }));
  return <Animated.Image source={source} style={[styles.layer, style]} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mark: { width: SIZE, height: SIZE },
  layer: { position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE },
});
