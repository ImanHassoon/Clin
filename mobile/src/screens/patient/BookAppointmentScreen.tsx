import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiRequest, ApiError } from "../../api/client";
import type { PatientDoctorsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PatientDoctorsStackParamList, "BookAppointment">;

export function BookAppointmentScreen({ route, navigation }: Props) {
  const { doctorId, doctorName, specialty } = route.params;
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({ doctorId, scheduledAt: scheduledAt.toISOString(), reason: reason || undefined }),
      });
      navigation.popToTop();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not book this appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Book with Dr. {doctorName}</Text>
      <Text style={styles.subtitle}>{specialty}</Text>

      <Text style={styles.label}>Date & time</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>{scheduledAt.toLocaleString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={scheduledAt}
          mode="datetime"
          minimumDate={new Date()}
          onChange={(_event, date) => {
            setShowPicker(Platform.OS === "ios");
            if (date) setScheduledAt(date);
          }}
        />
      )}

      <FormInput
        label="Reason for visit (optional)"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Request appointment" onPress={onSubmit} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: "#1B5E63" },
  subtitle: { color: "#5B6168", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#3A3F44", marginBottom: 6 },
  dateButton: {
    borderWidth: 1,
    borderColor: "#D7DBDF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  dateText: { fontSize: 15, color: "#1A1D1F" },
  error: { color: "#B3261E", marginBottom: 12 },
});
