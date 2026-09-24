import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts as useIBMPlexSansFonts,
} from "@expo-google-fonts/ibm-plex-sans";
import {
  Lora_400Regular,
  Lora_500Medium,
  useFonts as useLoraFonts,
} from "@expo-google-fonts/lora";
import { fonts } from "./theme";

// True once both families are ready. A load failure also returns true so the
// app still opens, falling back to the system font.
export function useAppFonts(): boolean {
  const [sansLoaded, sansError] = useIBMPlexSansFonts({
    [fonts.regular]: IBMPlexSans_400Regular,
    [fonts.medium]: IBMPlexSans_500Medium,
    [fonts.semibold]: IBMPlexSans_600SemiBold,
    [fonts.bold]: IBMPlexSans_700Bold,
  });
  const [voiceLoaded, voiceError] = useLoraFonts({
    [fonts.voice]: Lora_400Regular,
    [fonts.voiceMedium]: Lora_500Medium,
  });
  return (sansLoaded || sansError !== null) && (voiceLoaded || voiceError !== null);
}
