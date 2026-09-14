import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { StatusPill } from "../../components/StatusPill";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";
import type { Appointment } from "../../types";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DoctorDashboardScreen() {
  const { user, logout } = useAuth();
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

  const today = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), new Date()));

  const setStatus = async (id: string, status: "CONFIRMED" | "COMPLETED") => {
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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, Dr. {user?.lastName}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Today's schedule</Text>

      <FlatList
        data={today}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No appointments today.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.patientName}>
                {item.patient?.user.firstName} {item.patient?.user.lastName}
              </Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.time}>
              {new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
              {item.durationMin} min
            </Text>
            {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

            {item.status === "REQUESTED" && (
              <TouchableOpacity
                style={styles.action}
                onPress={() => setStatus(item.id, "CONFIRMED")}
                disabled={busyId === item.id}
              >
                <Text style={styles.actionText}>Confirm appointment</Text>
              </TouchableOpacity>
            )}
            {item.status === "CONFIRMED" && (
              <TouchableOpacity
                style={styles.action}
                onPress={() => setStatus(item.id, "COMPLETED")}
                disabled={busyId === item.id}
              >
                <Text style={styles.actionText}>Mark completed</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: "800", color: "#1B5E63" },
  logout: { color: "#B3261E", fontWeight: "600" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#3A3F44", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#1A1D1F" },
  time: { color: "#5B6168", marginBottom: 4 },
  reason: { color: "#3A3F44" },
  action: { marginTop: 10, alignSelf: "flex-start" },
  actionText: { color: "#1B5E63", fontWeight: "700" },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
