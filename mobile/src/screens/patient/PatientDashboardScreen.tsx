import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { StatusPill } from "../../components/StatusPill";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";
import type { Appointment } from "../../types";

export function PatientDashboardScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiRequest<{ appointments: Appointment[] }>("/appointments");
    setAppointments(data.appointments.filter((a) => a.status === "REQUESTED" || a.status === "CONFIRMED"));
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
      <Text style={styles.greeting}>Hi, {user?.firstName}</Text>
      <Text style={styles.sectionTitle}>Upcoming appointments</Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No upcoming appointments. Find a doctor to get started.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.doctorName}>
                Dr. {item.doctor?.user.firstName} {item.doctor?.user.lastName}
              </Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.specialty}>{item.doctor?.specialty}</Text>
            <Text style={styles.time}>{new Date(item.scheduledAt).toLocaleString()}</Text>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#3A3F44", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  doctorName: { fontSize: 16, fontWeight: "700", color: "#1A1D1F" },
  specialty: { color: "#5B6168", marginBottom: 2 },
  time: { color: "#5B6168" },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
