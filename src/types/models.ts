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
