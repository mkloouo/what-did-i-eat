import { StyleSheet, View } from "react-native";
import { theme } from "../theme/theme";
import { PropsWithChildren } from "react";

export function FabGroup({ children }: PropsWithChildren) {
  return <View style={styles.fabGroup}>{children}</View>;
}

const styles = StyleSheet.create({
  fabGroup: {
    position: "absolute",
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    rowGap: theme.spacing.sm,
  },
});
