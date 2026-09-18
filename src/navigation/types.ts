export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  EntryDetails: { entryId: string };
  PhotoDetails: { entryId: string; photoIndex: number };
};

export type TabParamList = {
  Feed: undefined;
  Tags: undefined;
  Settings: undefined;
};
