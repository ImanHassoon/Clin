import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import type { PatientProfileStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PatientProfileStackParamList, "PatientProfile">;

export function PatientProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>
      <Card>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.detail}>{user?.email}</Text>
        {user?.phone ? <Text style={styles.detail}>{user.phone}</Text> : null}
      </Card>

      <TouchableOpacity onPress={() => navigation.navigate("Consents")}>
        <Card>
          <Text style={styles.linkText}>Who has access to my records →</Text>
        </Card>
      </TouchableOpacity>

      <PrimaryButton title="Log out" onPress={logout} variant="danger" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  name: { fontSize: 18, fontWeight: "700", color: "#1A1D1F" },
  detail: { color: "#5B6168", marginTop: 4 },
  linkText: { color: "#1B5E63", fontWeight: "700" },
});
