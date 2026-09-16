export type RootStackParamList = {
  Feed: undefined;
  Config: undefined;
  NewEntry: undefined;
  GroupDetails: { entryIds: string[] };
  PhotoDetails: { entryId: string; photoIndex: number };
};
