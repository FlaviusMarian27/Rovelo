// Scan a building: camera pe tot ecranul (modal, fără taburi), cadru punctat, declanșator.
// Poza merge la "agent" (recognizeLandmark, mock deocamdată) → Place story.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Images, Info, X, Zap, ZapOff, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { colors, fonts, fontSize, radius, spacing } from '@/constants/theme';
import { recognizeLandmark } from '@/services/agent';

export default function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [flash, setFlash] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null); // uri-ul pozei analizate

  async function analyze(uri: string) {
    setAnalyzing(uri);
    try {
      const place = await recognizeLandmark(uri);
      // Închidem camera, apoi deschidem povestea în tab-ul Route, peste ecranul de unde ai venit
      // (ex. navigarea) → Back din poveste te întoarce acolo.
      router.back();
      router.push({ pathname: '/route/place/[id]', params: { id: place.id, photo: uri } });
    } catch {
      setAnalyzing(null);
      Alert.alert(t('scan.failTitle'), t('scan.failText'));
    }
  }

  async function takePhoto() {
    const photo = await camera.current?.takePictureAsync({ quality: 0.6 });
    if (photo?.uri) analyze(photo.uri);
  }

  async function pickFromGallery() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets[0]) analyze(res.assets[0].uri);
  }

  const showTips = () => Alert.alert(t('scan.tips'), t('scan.tipsText'));

  // Încă nu știm statusul permisiunii
  if (!permission) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      {analyzing ? (
        <Image source={{ uri: analyzing }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : permission.granted ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flash ? 'on' : 'off'}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.dim]} pointerEvents="none" />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <IconButton icon={X} label={t('common.close')} onPress={() => router.back()} />
          <Text style={styles.title}>{t('scan.title')}</Text>
          <IconButton
            icon={flash ? Zap : ZapOff}
            label={flash ? t('scan.flashOn') : t('scan.flashOff')}
            onPress={() => setFlash((f) => !f)}
          />
        </View>

        {!permission.granted ? (
          <View style={styles.permission}>
            <Camera size={40} color={colors.onPrimary} strokeWidth={1.5} />
            <Text style={styles.headline}>{t('scan.allowTitle')}</Text>
            <Text style={styles.sub}>{t('scan.allowText')}</Text>
            <View style={styles.permissionButtons}>
              <Button title={t('scan.allow')} onPress={requestPermission} />
              <Button title={t('scan.gallery')} variant="outline" onPress={pickFromGallery} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.frameArea}>
              <View style={styles.frame}>
                {analyzing && (
                  <View style={styles.analyzing}>
                    <ActivityIndicator color={colors.onPrimary} size="large" />
                    <Text style={styles.analyzingText}>{t('scan.analyzing')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headline}>{t('scan.frame')}</Text>
              <Text style={styles.sub}>{t('scan.frameText')}</Text>
            </View>

            <View style={styles.controls}>
              <IconButton icon={Images} label={t('scan.gallery')} onPress={pickFromGallery} />
              <Pressable
                onPress={takePhoto}
                disabled={!!analyzing}
                accessibilityRole="button"
                accessibilityLabel={t('scan.takePhoto')}
                style={({ pressed }) => [
                  styles.shutter,
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}>
                <View style={styles.shutterInner} />
              </Pressable>
              <IconButton icon={Info} label={t('scan.tips')} onPress={showTips} />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Icon size={22} color={colors.onPrimary} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  dim: { backgroundColor: 'rgba(0,0,0,0.15)' },
  overlay: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  title: { fontFamily: fonts.semibold, fontSize: fontSize.md + 1, color: colors.onPrimary },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  frameArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  frame: {
    width: '82%',
    aspectRatio: 0.82,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzing: { alignItems: 'center', gap: spacing.md },
  analyzingText: { fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.onPrimary },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.lg,
    color: colors.onPrimary,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.onPrimary },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  permissionButtons: { alignSelf: 'stretch', gap: spacing.md - 4, marginTop: spacing.lg },
});
