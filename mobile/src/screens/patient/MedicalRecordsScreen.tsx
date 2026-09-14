import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";
import type { Visit } from "../../types";
import type { PatientRecordsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PatientRecordsStackParamList, "MedicalRecords">;

export function MedicalRecordsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const patientId = user?.patientProfile?.id;

  const load = useCallback(async () => {
    if (!patientId) return;
    const data = await apiRequest<{ visits: Visit[] }>(`/patients/${patientId}/visits`);
    setVisits(data.visits);
  }, [patientId]);

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
      <Text style={styles.title}>My records</Text>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No visits recorded yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("RecordDetail", { visit: item })}>
            <Card>
              <Text style={styles.date}>{new Date(item.visitDate).toLocaleString()}</Text>
              <Text style={styles.chiefComplaint}>{item.chiefComplaint || "General visit"}</Text>
              <Text style={styles.summary}>
                {item.diagnoses.length} diagnosis{item.diagnoses.length === 1 ? "" : "es"} ·{" "}
                {item.imagingStudies.length} imaging · {item.testOrders.length} test
                {item.testOrders.length === 1 ? "" : "s"}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  date: { fontSize: 13, color: "#5B6168" },
  chiefComplaint: { fontSize: 16, fontWeight: "700", color: "#1A1D1F", marginTop: 2 },
  summary: { color: "#8A8F98", marginTop: 6, fontSize: 13 },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
