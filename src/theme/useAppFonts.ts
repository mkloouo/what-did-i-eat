import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
  useFonts,
} from "@expo-google-fonts/instrument-sans";
import { fonts } from "./theme";

// True once Instrument Sans is ready. A load failure also returns true so the
// app still opens, falling back to the system font.
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.regular]: InstrumentSans_400Regular,
    [fonts.medium]: InstrumentSans_500Medium,
    [fonts.semibold]: InstrumentSans_600SemiBold,
    [fonts.bold]: InstrumentSans_700Bold,
  });
  return loaded || error !== null;
}
