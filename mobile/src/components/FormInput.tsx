import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface Props extends TextInputProps {
  label: string;
}

export function FormInput({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, style]} placeholderTextColor="#8A8F98" {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#3A3F44", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D7DBDF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#1A1D1F",
  },
});
