// Tipurile de locuri din backend (PoiKind.java) grupate pentru filtrele din Explore.
// Numele tipurilor se traduc cu kinds.<kind>, ale grupurilor cu explore.groups.<group>.
import {
  Church,
  Landmark,
  Palette,
  Trees,
  UtensilsCrossed,
  Building2,
  type LucideIcon,
} from 'lucide-react-native';

export type PlaceGroup = 'culture' | 'faith' | 'history' | 'nature' | 'food' | 'city';

export const PLACE_GROUPS: { id: PlaceGroup; icon: LucideIcon; kinds: string[] }[] = [
  {
    id: 'history',
    icon: Landmark,
    kinds: ['castle', 'monument', 'memorial', 'historic', 'attraction'],
  },
  { id: 'culture', icon: Palette, kinds: ['museum', 'gallery', 'theatre', 'artwork'] },
  { id: 'faith', icon: Church, kinds: ['church'] },
  { id: 'nature', icon: Trees, kinds: ['park', 'garden', 'viewpoint'] },
  { id: 'food', icon: UtensilsCrossed, kinds: ['cafe', 'restaurant', 'bar', 'market'] },
  { id: 'city', icon: Building2, kinds: ['square', 'fountain'] },
];
