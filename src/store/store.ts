import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  PersistedState,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import entriesReducer from "./entriesSlice";
import settingsReducer from "./settingsSlice";
import tagsReducer from "./tagsSlice";
import appMetaReducer from "./appMetaSlice";

const rootReducer = combineReducers({
  entries: entriesReducer,
  settings: settingsReducer,
  tags: tagsReducer,
  appMeta: appMetaReducer,
});

// scrubberEnabled shipped defaulting to false (unreleased, dev-only) while
// the Wall's layout bugs got sorted out. It has no Settings toggle, so a
// device that already persisted `false` never had a real user preference —
// only this app's earlier default. Bumping the default back to true needs
// this one-time migration too, or redux-persist would keep restoring the
// stale `false` over the new reducer default.
const persistConfig = {
  key: "what-did-i-eat",
  storage: AsyncStorage,
  version: 1,
  migrate: createMigrate({
    // redux-persist's own PersistedState type only knows its bookkeeping
    // (`_persist`), not this store's shape — cast to reach into `appMeta`.
    1: (state) => {
      const previous = state as unknown as { appMeta?: object } | undefined;
      return {
        ...state,
        appMeta: { ...previous?.appMeta, scrubberEnabled: true },
      } as PersistedState;
    },
  }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
