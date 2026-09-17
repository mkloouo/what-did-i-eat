import { Ionicons } from '@expo/vector-icons';

export type Photo = {
  id: string;
  uri: string;
};

export type EntryLocation = {
  latitude: number;
  longitude: number;
  placeName: string | null;
};

export type Entry = {
  id: string;
  createdAt: string; // ISO 8601
  comment: string;
  location: EntryLocation | null;
  photos: Photo[];
};

export type PhotoLayoutAlgorithm = 'masonry' | 'treemap';

export type GroupingMode = 'rolling' | 'day';

export type Settings = {
  groupingMode: GroupingMode;
  rollingWindowMinutes: number;
  photoLayoutAlgorithm: PhotoLayoutAlgorithm;
};

export const TAG_ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  'restaurant-outline',
  'cafe-outline',
  'pizza-outline',
  'nutrition-outline',
  'ice-cream-outline',
  'wine-outline',
  'leaf-outline',
  'time-outline',
  'walk-outline',
  'moon-outline',
];

export type TagIcon = (typeof TAG_ICON_OPTIONS)[number];

export type Tag = {
  id: string;
  icon: TagIcon;
  label: string;
};
