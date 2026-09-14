import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ children, scroll = true, style }: Props) {
  const content = <View style={[styles.content, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  scroll: { flexGrow: 1 },
  content: { flex: 1, padding: 16 },
});
