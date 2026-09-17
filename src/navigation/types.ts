export type RootStackParamList = {
  Tabs: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};

export type TabParamList = {
  Feed: undefined;
  Tags: undefined;
  Settings: undefined;
};
