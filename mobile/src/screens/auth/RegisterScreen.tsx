import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/client";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [role, setRole] = useState<"PATIENT" | "DOCTOR">("PATIENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    firstName && lastName && email && password.length >= 8 && (role === "PATIENT" || (specialty && licenseNumber));

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        firstName,
        lastName,
        role,
        doctorProfile: role === "DOCTOR" ? { specialty, licenseNumber } : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
      </View>

      <View style={styles.roleRow}>
        {(["PATIENT", "DOCTOR"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleButton, role === r && styles.roleButtonActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {r === "PATIENT" ? "I'm a patient" : "I'm a doctor"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormInput label="First name" value={firstName} onChangeText={setFirstName} />
      <FormInput label="Last name" value={lastName} onChangeText={setLastName} />
      <FormInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <FormInput label="Password (min. 8 characters)" value={password} onChangeText={setPassword} secureTextEntry />

      {role === "DOCTOR" && (
        <>
          <FormInput label="Specialty" value={specialty} onChangeText={setSpecialty} placeholder="e.g. Cardiology" />
          <FormInput label="License number" value={licenseNumber} onChangeText={setLicenseNumber} />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Create account" onPress={onSubmit} loading={loading} disabled={!canSubmit} />

      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 24, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#1B5E63" },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D7DBDF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  roleButtonActive: { backgroundColor: "#1B5E63", borderColor: "#1B5E63" },
  roleText: { color: "#3A3F44", fontWeight: "600" },
  roleTextActive: { color: "#fff" },
  error: { color: "#B3261E", marginBottom: 12 },
  link: { marginTop: 20, marginBottom: 24, alignItems: "center" },
  linkText: { color: "#1B5E63", fontWeight: "600" },
});
