import { EntriesState } from './entriesSlice';
import { Settings } from '../types/models';

export type RootState = {
  entries: EntriesState;
  settings: Settings;
};
