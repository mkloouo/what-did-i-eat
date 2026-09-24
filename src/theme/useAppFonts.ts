import { useFonts } from "expo-font";
// Per-weight subpaths, not the package roots: the roots re-export every weight
// the family ships, and Metro bundles every font file they require.
import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans/400Regular";
import { IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans/500Medium";
import { IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans/600SemiBold";
import { IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans/700Bold";
import { Lora_400Regular } from "@expo-google-fonts/lora/400Regular";
import { Lora_500Medium } from "@expo-google-fonts/lora/500Medium";
import { fonts } from "./theme";

// True once both families are ready. A load failure also returns true so the
// app still opens, falling back to the system font.
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.regular]: IBMPlexSans_400Regular,
    [fonts.medium]: IBMPlexSans_500Medium,
    [fonts.semibold]: IBMPlexSans_600SemiBold,
    [fonts.bold]: IBMPlexSans_700Bold,
    [fonts.voice]: Lora_400Regular,
    [fonts.voiceMedium]: Lora_500Medium,
  });
  return loaded || error !== null;
}
