import { Image, View, StyleSheet } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  uri: string;
  size?: number;
};

export function PhotoThumbnail({ uri, size = 96 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.surface,
  },
});
