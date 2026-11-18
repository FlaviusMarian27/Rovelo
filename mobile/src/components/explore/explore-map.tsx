// Harta din Explore: toate locurile din zonă ca puncte; cele din ruta ta, numerotate.
// Când oprești harta din mișcare, spune ce zonă se vede (ca Explore să încarce locurile de acolo).
//
// Performanță: punctele sunt imagini PNG (prop-ul `image`), nu View-uri React. Pe Android, harta
// Google transformă fiecare View într-o imagine, iar cu sute de puncte asta o încetinea.
// Locul selectat e un singur marker separat, deasupra, ca restul să nu se redeseneze.
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

// Aceleași culori ca `primary` din tema light / dark (assets/images/markers, generate o dată)
const DOT = {
  light: require('@/assets/images/markers/dot-light.png'),
  dark: require('@/assets/images/markers/dot-dark.png'),
};
const DOT_SELECTED = {
  light: require('@/assets/images/markers/dot-selected-light.png'),
  dark: require('@/assets/images/markers/dot-selected-dark.png'),
};

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
  const selected =
    selectedId && !inRoute.has(selectedId) ? places.find((p) => p.id === selectedId) : null;

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
        .map((p) => (
          <Marker
            key={`${scheme}:${p.id}`}
            coordinate={p.coord}
            anchor={{ x: 0.5, y: 0.5 }}
            image={DOT[scheme]}
            onPress={() => onSelect(p.id)}
            stopPropagation
            tracksViewChanges={false}
            zIndex={1}
          />
        ))}
      {selected && (
        <Marker
          key={`selected:${scheme}:${selected.id}`}
          coordinate={selected.coord}
          anchor={{ x: 0.5, y: 0.5 }}
          image={DOT_SELECTED[scheme]}
          stopPropagation
          tracksViewChanges={false}
          zIndex={3}
        />
      )}
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
