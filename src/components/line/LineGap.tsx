import { Text, StyleSheet } from "react-native";
import { CONTENT_INSET } from "./LineEntryRow";
import { theme } from "../../theme/theme";

type Props = {
  label: string;
};

// Where the spine breaks between two entries far apart in time: just how
// long the gap was ("1 h 53 m earlier"), aligned with the entries' content.
export function LineGap({ label }: Props) {
  return <Text style={styles.label}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...theme.typography.caption,
    color: theme.colors.graphite,
    paddingLeft: CONTENT_INSET,
    paddingRight: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
});
