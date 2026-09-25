export type RootStackParamList = {
  Home: undefined;
  NewEntry: { initialPhotoUris: string[] } | undefined;
  EntryDetails: { entryId: string; photoIndex?: number };
  PhotoDetails: { entryId: string; photoIndex: number };
  Settings: undefined;
  Tags: undefined;
};
