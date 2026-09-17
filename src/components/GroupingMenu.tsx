import { useState } from "react";
import { Modal, Pressable, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setBundleByDay,
  setPhotoLayoutAlgorithm,
} from "../store/settingsSlice";
import { PhotoLayoutAlgorithm } from "../types/models";
import { theme } from "../theme/theme";
import { Card } from "./Card";
import { IconButton } from "./IconButton";
import { SegmentedControl } from "./SegmentedControl";

export function GroupingMenu() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const bundleByDay = useAppSelector((state) => state.settings.bundleByDay);
  const photoLayoutAlgorithm = useAppSelector(
    (state) => state.settings.photoLayoutAlgorithm,
  );
  const dispatch = useAppDispatch();

  function selectBundleByDay(value: boolean) {
    dispatch(setBundleByDay(value));
    setOpen(false);
  }

  function selectPhotoLayout(value: PhotoLayoutAlgorithm) {
    dispatch(setPhotoLayoutAlgorithm(value));
    setOpen(false);
  }

  return (
    <>
      <IconButton name="ellipsis-horizontal" onPress={() => setOpen(true)} />
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Card style={[styles.popover, { top: insets.top + 48 }]}>
            <Text style={styles.label}>Group by</Text>
            <SegmentedControl
              value={bundleByDay}
              options={[
                { value: false, label: "Hour" },
                { value: true, label: "Day" },
              ]}
              onChange={selectBundleByDay}
            />
            <Text style={[styles.label, styles.secondLabel]}>Photo layout</Text>
            <SegmentedControl
              value={photoLayoutAlgorithm}
              options={[
                { value: "masonry", label: "Columns" },
                { value: "treemap", label: "Mosaic" },
              ]}
              onChange={selectPhotoLayout}
            />
          </Card>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  popover: {
    position: "absolute",
    right: theme.spacing.md,
    width: 240,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  secondLabel: {
    marginTop: theme.spacing.md,
  },
});
