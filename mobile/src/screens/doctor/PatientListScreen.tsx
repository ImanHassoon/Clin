import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { apiRequest } from "../../api/client";
import type { PatientSummary } from "../../types";
import type { DoctorPatientsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DoctorPatientsStackParamList, "PatientList">;

export function PatientListScreen({ navigation }: Props) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiRequest<{ patients: PatientSummary[] }>("/doctors/me/patients");
    setPatients(data.patients);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>My patients</Text>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No linked patients yet. Confirming an appointment establishes access to a patient's record.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("PatientDetail", {
                patientId: item.id,
                patientName: `${item.user.firstName} ${item.user.lastName}`,
              })
            }
          >
            <Card>
              <Text style={styles.name}>
                {item.user.firstName} {item.user.lastName}
              </Text>
              <Text style={styles.email}>{item.user.email}</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  name: { fontSize: 16, fontWeight: "700", color: "#1A1D1F" },
  email: { color: "#5B6168", marginTop: 2 },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
