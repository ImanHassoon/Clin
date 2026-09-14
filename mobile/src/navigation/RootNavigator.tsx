import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { DoctorNavigator } from "./DoctorNavigator";
import { PatientNavigator } from "./PatientNavigator";
import { PrimaryButton } from "../components/PrimaryButton";

function AdminPlaceholder() {
  const { logout } = useAuth();
  return (
    <View style={styles.center}>
      <Text style={styles.placeholderTitle}>Clinic admin console</Text>
      <Text style={styles.placeholderBody}>
        Clinic-admin scheduling and staff management isn't built yet in this app — see docs/ARCHITECTURE.md.
      </Text>
      <PrimaryButton title="Log out" onPress={logout} variant="secondary" style={styles.placeholderButton} />
    </View>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E63" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : user.role === "DOCTOR" ? (
        <DoctorNavigator />
      ) : user.role === "PATIENT" ? (
        <PatientNavigator />
      ) : (
        <AdminPlaceholder />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F7F8FA" },
  placeholderTitle: { fontSize: 20, fontWeight: "800", color: "#1B5E63", marginBottom: 10, textAlign: "center" },
  placeholderBody: { color: "#5B6168", textAlign: "center", marginBottom: 20 },
  placeholderButton: { minWidth: 160 },
});
