// Harta din Explore: toate locurile din zonă ca puncte; cele din ruta ta, numerotate.
// Când oprești harta din mișcare, spune ce zonă se vede (ca Explore să încarce locurile de acolo).
import { useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { mapStyleDark, mapStyleLight } from '@/constants/map-style';
import { fonts } from '@/constants/theme';
import { makeStyles, useTheme } from '@/context/theme';
import type { Coord, Stop } from '@/types';

export type ExploreMapHandle = { focus: (c: Coord, zoom?: number) => void };

type Props = {
  ref?: Ref<ExploreMapHandle>;
  center: Coord; // de unde pornește harta
  places: Stop[];
  routeStops: Stop[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAreaChange: (center: Coord, radiusMeters: number) => void;
};

// Cât de mare e zona vizibilă: jumătate din înălțime, în metri
const radiusOf = (r: Region) => (r.latitudeDelta * 111_320) / 2;

export function ExploreMap({
  ref,
  center,
  places,
  routeStops,
  selectedId,
  onSelect,
  onAreaChange,
}: Props) {
  const { scheme } = useTheme();
  const styles = useStyles();
  const map = useRef<MapView>(null);
  const inRoute = new Set(routeStops.map((s) => s.id));

  useImperativeHandle(ref, () => ({
    focus: (c, zoom = 17) => map.current?.animateCamera({ center: c, zoom }, { duration: 400 }),
  }));

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      customMapStyle={scheme === 'dark' ? mapStyleDark : mapStyleLight}
      mapType="mutedStandard"
      userInterfaceStyle={scheme}
      initialRegion={{ ...center, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      onMapReady={() =>
        onAreaChange(center, radiusOf({ ...center, latitudeDelta: 0.02, longitudeDelta: 0.02 }))
      }
      onRegionChangeComplete={(r) =>
        onAreaChange({ latitude: r.latitude, longitude: r.longitude }, radiusOf(r))
      }
      onPress={() => onSelect(null)}
      showsUserLocation
      showsMyLocationButton={false}
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsCompass={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}>
      {places
        .filter((p) => !inRoute.has(p.id))
        .map((p) => {
          const selected = p.id === selectedId;
          return (
            <Marker
              key={`${p.id}:${selected}`}
              coordinate={p.coord}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onSelect(p.id)}
              stopPropagation
              tracksViewChanges={false}
              zIndex={selected ? 3 : 1}>
              <View style={[styles.dot, selected && styles.dotSelected]} />
            </Marker>
          );
        })}
      {routeStops.map((s, i) => (
        <Marker
          key={`route:${s.id}:${s.id === selectedId}`}
          coordinate={s.coord}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => onSelect(s.id)}
          stopPropagation
          tracksViewChanges={false}
          zIndex={2}>
          <View style={[styles.pin, s.id === selectedId && styles.pinSelected]}>
            <Text style={styles.pinText}>{i + 1}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const useStyles = makeStyles((colors) => ({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.onPrimary,
  },
  dotSelected: { width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  pinText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.background },
}));
