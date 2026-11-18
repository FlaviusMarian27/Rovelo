// Stil Google Maps alb și liniștit, ca în Figma: fără POI-uri și transport,
// străzi albe pe fundal gri foarte deschis, apa (Bega) gri-albăstrui.
// Se poate edita vizual pe https://mapstyle.withgoogle.com (export JSON).
import type { MapStyleElement } from 'react-native-maps';

export const mapStyleLight: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#F3F3F4' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A8A90' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F3F3F4' }] },

  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E6EEE6' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E4E4E7' }] },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9A9AA0' }],
  },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },

  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#ECECEE' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DCE5EC' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9AA8B3' }] },
];

// Aceeași hartă liniștită, pe întuneric (tema dark).
export const mapStyleDark: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#18181B' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7A7A82' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#18181B' }] },

  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1C2620' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A2A2F' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1F1F23' }] },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8A8A92' }],
  },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#34343A' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },

  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#1E1E22' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#16212B' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5E6F7C' }] },
];
