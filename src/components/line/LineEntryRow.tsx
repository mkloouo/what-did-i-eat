import { View, Text, Pressable, StyleSheet } from "react-native";
import { PhotoStack } from "../PhotoStack";
import { resolvePhotoUri } from "../../storage/photoStorage";
import { formatTime } from "../../utils/dateFormat";
import { Entry, Tag } from "../../types/models";
import { theme } from "../../theme/theme";

// Shared with LineGap so its label lines up with the entries' content column.
export const TIME_COLUMN_WIDTH = 56;
export const RAIL_WIDTH = 20;
export const CONTENT_INSET =
  theme.spacing.md + TIME_COLUMN_WIDTH + RAIL_WIDTH + theme.spacing.xs;

const DOT_SIZE = 10;
// Centres the dot on the time label's first line (typography.time is 14px
// on a 20px line).
const DOT_CENTER = 10;

type Props = {
  entry: Entry;
  joinsNewer: boolean;
  joinsOlder: boolean;
  tagsById: Record<string, Tag>;
  wallColumns: number;
  onPressEntry: (entryId: string) => void;
};

// One entry on the Line: its time in the left gutter, a dot on the spine,
// and — hanging off that dot — only this entry's own photos, comment and
// tags, so words can never be read as belonging to someone else's photo.
// The spine runs up/down to the neighbouring entries while they're close
// in time (see buildLineItems).
export function LineEntryRow({
  entry,
  joinsNewer,
  joinsOlder,
  tagsById,
  wallColumns,
  onPressEntry,
}: Props) {
  const tagLabels = (entry.tagIds ?? [])
    .map((id) => tagsById[id]?.label)
    .filter((label): label is string => Boolean(label));
  const photos = entry.photos.map((photo) => resolvePhotoUri(photo.uri));
  const open = () => onPressEntry(entry.id);

  return (
    <Pressable
      style={styles.row}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`Entry at ${formatTime(entry.createdAt)}`}
    >
      <Text style={styles.time} numberOfLines={1} adjustsFontSizeToFit>
        {formatTime(entry.createdAt)}
      </Text>
      <View style={styles.rail}>
        {joinsNewer ? <View style={[styles.line, styles.lineUp]} /> : null}
        {joinsOlder ? <View style={[styles.line, styles.lineDown]} /> : null}
        <View style={styles.dot} />
      </View>
      <View style={styles.content}>
        <PhotoStack
          photosByEntry={[photos]}
          columns={wallColumns}
          cornerRadius={theme.radii.sm}
          onPhotoPress={open}
        />
        {entry.comment ? (
          <Text style={styles.comment} numberOfLines={3}>
            {entry.comment}
          </Text>
        ) : null}
        {tagLabels.length > 0 ? (
          <Text style={styles.tags}>{tagLabels.join(", ")}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  time: {
    ...theme.typography.time,
    lineHeight: 20,
    width: TIME_COLUMN_WIDTH,
    color: theme.colors.ink,
  },
  rail: {
    width: RAIL_WIDTH,
  },
  line: {
    position: "absolute",
    left: (RAIL_WIDTH - 2) / 2,
    width: 2,
    backgroundColor: theme.colors.pine,
    opacity: 0.45,
  },
  lineUp: {
    top: 0,
    height: DOT_CENTER,
  },
  lineDown: {
    top: DOT_CENTER,
    bottom: 0,
  },
  dot: {
    position: "absolute",
    left: (RAIL_WIDTH - DOT_SIZE) / 2,
    top: DOT_CENTER - DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: theme.colors.pine,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  comment: {
    ...theme.typography.voice,
    color: theme.colors.ink,
  },
  tags: {
    ...theme.typography.caption,
    color: theme.colors.accent,
  },
});
