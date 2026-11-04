// Harta traseului: harta nativă (Google pe Android, Apple pe iOS) cu stil alb, minimal,
// linia roșie prin opriri și pini numerotați. Merge cu oricâte opriri.
// Folosită și pe Your route (overview) și pe Live navigation (cu poziția ta).
//
// De ce nu tile-uri OSM: CARTO cere acum cheie, iar tile.openstreetmap.org nu permite
// aplicații fără User-Agent propriu. Datele traseului rămân din OpenStreetMap (backend).
import { useImperativeHandle, useRef, type Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { mapStyleLight } from '@/constants/map-style';
import { colors, fonts } from '@/constants/theme';
import type { Coord, Route } from '@/types';

export type RouteMapHandle = {
  focusStop: (index: number) => void;
  centerOn: (c: Coord, zoom?: number) => void;
  fitRoute: () => void;
};

type Padding = { top: number; right: number; bottom: number; left: number };
const DEFAULT_PADDING: Padding = { top: 48, right: 48, bottom: 48, left: 48 };

type Props = {
  route: Route;
  ref?: Ref<RouteMapHandle>;
  userPosition?: Coord | null;
  currentIndex?: number; // opririle dinainte apar ca vizitate (gri)
  edgePadding?: Padding; // spațiu ocupat de carduri peste hartă
  onUserPan?: () => void;
};

export function RouteMap({
  route,
  ref,
  userPosition,
  currentIndex,
  edgePadding = DEFAULT_PADDING,
  onUserPan,
}: Props) {
  const map = useRef<MapView>(null);
  const coords = route.stops.map((s) => s.coord);

  const fitRoute = () => map.current?.fitToCoordinates(coords, { edgePadding, animated: true });

  useImperativeHandle(ref, () => ({
    focusStop: (i) => {
      const c = route.stops[i]?.coord;
      if (c) map.current?.animateCamera({ center: c, zoom: 17 }, { duration: 400 });
    },
    centerOn: (c, zoom = 17) => map.current?.animateCamera({ center: c, zoom }, { duration: 500 }),
    fitRoute,
  }));

  return (
    <View style={styles.wrap}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        customMapStyle={mapStyleLight} // Android (Google); pe iOS se ignoră
        mapType="mutedStandard" // iOS: hartă mai ștearsă; Android o tratează ca standard
        userInterfaceStyle="light"
        initialRegion={{ ...coords[0], latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        onMapReady={() => map.current?.fitToCoordinates(coords, { edgePadding, animated: false })}
        onPanDrag={onUserPan}
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
        {route.stops.map((s, i) => {
          const visited = currentIndex !== undefined && i < currentIndex;
          const current = currentIndex === i;
          return (
            <Marker
              key={s.id}
              coordinate={s.coord}
              anchor={{ x: 0.5, y: 0.5 }}
              title={s.name}
              zIndex={current ? 2 : 1}>
              <View
                style={[styles.pin, visited && styles.pinVisited, current && styles.pinCurrent]}>
                <Text style={styles.pinText}>{i + 1}</Text>
              </View>
            </Marker>
          );
        })}
        {userPosition && (
          <Marker coordinate={userPosition} anchor={{ x: 0.5, y: 0.5 }} zIndex={3}>
            <View style={styles.userHalo}>
              <View style={styles.userDot} />
            </View>
          </Marker>
        )}
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
  pinVisited: { backgroundColor: colors.textMuted },
  pinCurrent: { width: 34, height: 34, borderRadius: 17, borderWidth: 3 },
  pinText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onPrimary },
  userHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.userLocationHalo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.userLocation,
    borderWidth: 3,
    borderColor: colors.onPrimary,
  },
});
