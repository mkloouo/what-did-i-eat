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
  tagIds?: string[];
};

export type GroupingMode = "rolling" | "day";

export type TimelineView = "wall" | "days";

export type Settings = {
  groupingMode: GroupingMode;
  rollingWindowMinutes: number;
  wallColumns: number;
  inferDateFromFirstImportedPhoto: boolean;
  captureLocation: boolean;
};

export const TAG_ICON_OPTIONS = [
  "restaurant-outline",
  "cafe-outline",
  "pizza-outline",
  "nutrition-outline",
  "ice-cream-outline",
  "wine-outline",
  "beer-outline",
  "pint-outline",
  "fast-food-outline",
  "egg-outline",
  "fish-outline",
  "basket-outline",
  "cart-outline",
  "bag-outline",
  "gift-outline",
  "leaf-outline",
  "flower-outline",
  "flame-outline",
  "water-outline",
  "flask-outline",
  "time-outline",
  "timer-outline",
  "walk-outline",
  "bicycle-outline",
  "barbell-outline",
  "fitness-outline",
  "football-outline",
  "basketball-outline",
  "american-football-outline",
  "car-outline",
  "car-sport-outline",
  "bus-outline",
  "train-outline",
  "boat-outline",
  "airplane-outline",
  "home-outline",
  "bed-outline",
  "briefcase-outline",
  "business-outline",
  "book-outline",
  "musical-notes-outline",
  "game-controller-outline",
  "paw-outline",
  "body-outline",
  "medkit-outline",
  "heart-outline",
  "happy-outline",
  "sad-outline",
  "star-outline",
  "sunny-outline",
  "partly-sunny-outline",
  "rainy-outline",
  "thunderstorm-outline",
  "snow-outline",
  "moon-outline",
] as const;

export type TagIcon = (typeof TAG_ICON_OPTIONS)[number];

export type Tag = {
  id: string;
  icon: TagIcon;
  label: string;
};
