export type RootStackParamList = {
  Home: undefined;
  NewEntry: { openCamera: boolean } | undefined;
  EntryDetails: { entryId: string };
  PhotoDetails: { entryId: string; photoIndex: number };
  Settings: undefined;
  Tags: undefined;
};
