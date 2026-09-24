export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: { openCamera: boolean } | undefined;
  GroupDetails: { entryIds: string[]; title: string };
  EntryDetails: { entryId: string };
  PhotoDetails: { entryId: string; photoIndex: number };
};

export type TabParamList = {
  Feed: undefined;
  Tags: undefined;
  Settings: undefined;
};
