export type RootStackParamList = {
  Feed: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};
