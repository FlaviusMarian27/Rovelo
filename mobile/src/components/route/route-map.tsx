// Harta traseului: harta nativă (Google pe Android, Apple pe iOS) cu stil alb, minimal,
// linia roșie prin opriri și pini numerotați. Merge cu oricâte opriri.
//
// De ce nu tile-uri OSM: CARTO cere acum cheie, iar tile.openstreetmap.org nu permite
// aplicații fără User-Agent propriu. Datele traseului rămân din OpenStreetMap (backend).
import { useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { mapStyleLight } from '@/constants/map-style';
import { colors, fonts } from '@/constants/theme';
import type { Route } from '@/types';

export type RouteMapHandle = { focusStop: (index: number) => void };

const EDGE_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

type Props = { route: Route; ref?: Ref<RouteMapHandle> };

export function RouteMap({ route, ref }: Props) {
  const map = useRef<MapView>(null);
  const coords = route.stops.map((s) => s.coord);

  const fitAll = () =>
    map.current?.fitToCoordinates(coords, { edgePadding: EDGE_PADDING, animated: false });

  useImperativeHandle(ref, () => ({
    focusStop: (i) => {
      const c = route.stops[i]?.coord;
      if (c) map.current?.animateCamera({ center: c, zoom: 17 }, { duration: 400 });
    },
  }));

  return (
    <View style={styles.wrap}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        customMapStyle={mapStyleLight} // Android (Google); pe iOS se ignoră
        mapType="mutedStandard" // iOS: hartă mai ștearsă; Android o tratează ca standard
        userInterfaceStyle="light"
        initialRegion={{
          ...coords[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onMapReady={fitAll}
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsCompass={false}
        showsTraffic={false}
        showsIndoors={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}>
        <Polyline
          coordinates={route.path}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineJoin="round"
          lineCap="round"
        />
        {route.stops.map((s, i) => (
          <Marker key={s.id} coordinate={s.coord} anchor={{ x: 0.5, y: 0.5 }} title={s.name}>
            <View style={styles.pin}>
              <Text style={styles.pinText}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onPrimary },
});
