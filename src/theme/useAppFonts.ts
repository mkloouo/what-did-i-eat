import {
  IBMPlexSansCondensed_400Regular,
  IBMPlexSansCondensed_500Medium,
  IBMPlexSansCondensed_600SemiBold,
  IBMPlexSansCondensed_700Bold,
  useFonts as useIBMPlexSansCondensedFonts,
} from "@expo-google-fonts/ibm-plex-sans-condensed";
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  useFonts as useNewsreaderFonts,
} from "@expo-google-fonts/newsreader";
import { fonts } from "./theme";

// True once both families are ready. A load failure also returns true so the
// app still opens, falling back to the system font.
export function useAppFonts(): boolean {
  const [sansLoaded, sansError] = useIBMPlexSansCondensedFonts({
    [fonts.regular]: IBMPlexSansCondensed_400Regular,
    [fonts.medium]: IBMPlexSansCondensed_500Medium,
    [fonts.semibold]: IBMPlexSansCondensed_600SemiBold,
    [fonts.bold]: IBMPlexSansCondensed_700Bold,
  });
  const [voiceLoaded, voiceError] = useNewsreaderFonts({
    [fonts.voice]: Newsreader_400Regular,
    [fonts.voiceMedium]: Newsreader_500Medium,
  });
  return (sansLoaded || sansError !== null) && (voiceLoaded || voiceError !== null);
}
