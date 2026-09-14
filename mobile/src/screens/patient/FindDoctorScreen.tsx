import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { FormInput } from "../../components/FormInput";
import { apiRequest } from "../../api/client";
import type { DoctorProfile } from "../../types";
import type { PatientDoctorsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PatientDoctorsStackParamList, "FindDoctor">;

export function FindDoctorScreen({ navigation }: Props) {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [specialty, setSpecialty] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (query?: string) => {
    const qs = query ? `?specialty=${encodeURIComponent(query)}` : "";
    const data = await apiRequest<{ doctors: DoctorProfile[] }>(`/doctors${qs}`);
    setDoctors(data.doctors);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(specialty).catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>Find a doctor</Text>
      <FormInput
        label="Filter by specialty"
        value={specialty}
        onChangeText={setSpecialty}
        onSubmitEditing={() => load(specialty)}
        placeholder="e.g. Cardiology"
      />

      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No doctors found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("BookAppointment", {
                doctorId: item.id,
                doctorName: `${item.user.firstName} ${item.user.lastName}`,
                specialty: item.specialty,
              })
            }
          >
            <Card>
              <Text style={styles.name}>
                Dr. {item.user.firstName} {item.user.lastName}
              </Text>
              <Text style={styles.specialty}>{item.specialty}</Text>
              {item.clinic ? <Text style={styles.clinic}>{item.clinic.name}</Text> : null}
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
  specialty: { color: "#5B6168", marginTop: 2 },
  clinic: { color: "#8A8F98", marginTop: 2, fontSize: 13 },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
