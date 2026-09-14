import React from "react";
import { StyleSheet, Text } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../context/AuthContext";

export function DoctorProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>
      <Card>
        <Text style={styles.name}>
          Dr. {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.detail}>{user?.email}</Text>
        {user?.phone ? <Text style={styles.detail}>{user.phone}</Text> : null}
      </Card>
      <PrimaryButton title="Log out" onPress={logout} variant="danger" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  name: { fontSize: 18, fontWeight: "700", color: "#1A1D1F" },
  detail: { color: "#5B6168", marginTop: 4 },
});
