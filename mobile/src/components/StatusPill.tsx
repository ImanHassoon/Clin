import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, { bg: string; fg: string }> = {
  REQUESTED: { bg: "#FFF3D6", fg: "#8A6100" },
  CONFIRMED: { bg: "#DDF0E4", fg: "#1B6B3B" },
  COMPLETED: { bg: "#E1E7FF", fg: "#2B3A9E" },
  CANCELLED: { bg: "#FBE2E1", fg: "#A32C24" },
  NO_SHOW: { bg: "#EDEDED", fg: "#555" },
  OPEN: { bg: "#DDF0E4", fg: "#1B6B3B" },
  CLOSED: { bg: "#EDEDED", fg: "#555" },
  ORDERED: { bg: "#FFF3D6", fg: "#8A6100" },
  IN_PROGRESS: { bg: "#E1E7FF", fg: "#2B3A9E" },
};

export function StatusPill({ status }: { status: string }) {
  const palette = COLORS[status] ?? { bg: "#EDEDED", fg: "#555" };
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{status.replace("_", " ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "700" },
});
