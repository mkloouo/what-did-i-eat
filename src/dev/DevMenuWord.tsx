import { useRef } from "react";
import { Alert, Text } from "react-native";
import { useAppDispatch } from "../store/hooks";
import { isDevelopmentVariant } from "../utils/appVariant";
import { clearAllEntries, loadDemoData } from "./demoData";
import { createTapCounter } from "./tapCounter";

const TAPS_TO_OPEN = 10;
const MAX_TAP_GAP_MS = 1500;

type Props = {
  word: string;
  // Called after the menu replaced or cleared the entries.
  onDataChanged: () => void;
};

/**
 * Renders `word` inside a parent <Text>. In development-variant builds,
 * tapping it 10 times in a row opens a hidden dev menu; everywhere else
 * it's plain text.
 */
export function DevMenuWord({ word, onDataChanged }: Props) {
  if (!isDevelopmentVariant) return <>{word}</>;
  return <DevMenuTrigger word={word} onDataChanged={onDataChanged} />;
}

function DevMenuTrigger({ word, onDataChanged }: Props) {
  const dispatch = useAppDispatch();
  const tapRef = useRef(createTapCounter(TAPS_TO_OPEN, MAX_TAP_GAP_MS));

  async function run(action: () => Promise<string | null>) {
    try {
      const message = await action();
      onDataChanged();
      if (message) Alert.alert(message);
    } catch (error) {
      Alert.alert("Dev menu failed", String(error));
    }
  }

  function openMenu() {
    Alert.alert("Dev menu", "Replaces the data on this device.", [
      {
        text: "Load demo data",
        onPress: () =>
          run(async () => {
            const count = await dispatch(loadDemoData());
            return count > 0 ? `Created ${count} entries` : null;
          }),
      },
      {
        text: "Clear all entries",
        style: "destructive",
        onPress: () =>
          run(async () => {
            await dispatch(clearAllEntries());
            return null;
          }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <Text
      onPress={() => {
        if (tapRef.current(Date.now())) openMenu();
      }}
      suppressHighlighting
    >
      {word}
    </Text>
  );
}
