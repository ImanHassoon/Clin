import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = "primary", style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#1B5E63" : "#fff"} />
      ) : (
        <Text style={[styles.text, variant === "secondary" && styles.textSecondary]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: "#1B5E63" },
  secondary: { backgroundColor: "#E7EFEF", borderWidth: 1, borderColor: "#1B5E63" },
  danger: { backgroundColor: "#B3261E" },
  disabled: { opacity: 0.5 },
  text: { color: "#fff", fontSize: 16, fontWeight: "600" },
  textSecondary: { color: "#1B5E63" },
});
