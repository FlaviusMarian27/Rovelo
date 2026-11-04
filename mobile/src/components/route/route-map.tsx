// Harta traseului: tile-uri OpenStreetMap (stil CARTO light, alb, ca în Figma),
// linia roșie prin opriri și pini numerotați. Merge cu oricâte opriri.
import { useImperativeHandle, useRef, type Ref } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

import { colors, fonts } from '@/constants/theme';
import type { Route } from '@/types';

export type RouteMapHandle = { focusStop: (index: number) => void };

const TILE_URL = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png';
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
        // Pe Android "none" = fără hartă Google sub tile-uri; pe iOS tile-urile o înlocuiesc.
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        initialRegion={{
          ...coords[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onMapReady={fitAll}
        showsPointsOfInterests={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}>
        <UrlTile urlTemplate={TILE_URL} maximumZ={19} shouldReplaceMapContent tileSize={256} />
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
      <Text style={styles.attribution}>© OpenStreetMap © CARTO</Text>
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
  attribution: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    fontSize: 9,
    color: colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 3,
  },
});
