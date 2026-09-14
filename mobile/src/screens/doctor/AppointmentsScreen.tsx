import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { StatusPill } from "../../components/StatusPill";
import { apiRequest } from "../../api/client";
import type { Appointment, AppointmentStatus } from "../../types";

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await apiRequest<{ appointments: Appointment[] }>("/appointments");
    setAppointments(data.appointments);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  };

  const setStatus = async (id: string, status: AppointmentStatus) => {
    setBusyId(id);
    try {
      await apiRequest(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No appointments yet.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.patientName}>
                {item.patient?.user.firstName} {item.patient?.user.lastName}
              </Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.time}>{new Date(item.scheduledAt).toLocaleString()}</Text>
            {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

            {(item.status === "REQUESTED" || item.status === "CONFIRMED") && (
              <View style={styles.actions}>
                {item.status === "REQUESTED" && (
                  <TouchableOpacity disabled={busyId === item.id} onPress={() => setStatus(item.id, "CONFIRMED")}>
                    <Text style={styles.action}>Confirm</Text>
                  </TouchableOpacity>
                )}
                {item.status === "CONFIRMED" && (
                  <TouchableOpacity disabled={busyId === item.id} onPress={() => setStatus(item.id, "COMPLETED")}>
                    <Text style={styles.action}>Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity disabled={busyId === item.id} onPress={() => setStatus(item.id, "CANCELLED")}>
                  <Text style={styles.actionDanger}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#1A1D1F" },
  time: { color: "#5B6168", marginBottom: 4 },
  reason: { color: "#3A3F44" },
  actions: { flexDirection: "row", gap: 20, marginTop: 10 },
  action: { color: "#1B5E63", fontWeight: "700" },
  actionDanger: { color: "#B3261E", fontWeight: "700" },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
