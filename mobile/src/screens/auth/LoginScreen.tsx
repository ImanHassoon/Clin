import React, { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/client";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Clin</Text>
        <Text style={styles.subtitle}>Sign in to manage your care</Text>
      </View>

      <FormInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <FormInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Sign in" onPress={onSubmit} loading={loading} disabled={!email || !password} />

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>New here? Create an account</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 48, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "800", color: "#1B5E63" },
  subtitle: { fontSize: 15, color: "#5B6168", marginTop: 4 },
  error: { color: "#B3261E", marginBottom: 12 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#1B5E63", fontWeight: "600" },
});
