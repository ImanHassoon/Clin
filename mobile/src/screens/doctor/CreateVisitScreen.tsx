import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiRequest, ApiError } from "../../api/client";
import type { Visit } from "../../types";
import type { DoctorPatientsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DoctorPatientsStackParamList, "CreateVisit">;

export function CreateVisitScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params;

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");

  const [diagnosisDescription, setDiagnosisDescription] = useState("");
  const [icdCode, setIcdCode] = useState("");

  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { visit } = await apiRequest<{ visit: Visit }>("/visits", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          chiefComplaint: chiefComplaint || undefined,
          notes: notes || undefined,
          vitals:
            bloodPressure || heartRate
              ? {
                  bloodPressure: bloodPressure || undefined,
                  heartRate: heartRate ? Number(heartRate) : undefined,
                }
              : undefined,
        }),
      });

      if (diagnosisDescription) {
        await apiRequest(`/visits/${visit.id}/diagnoses`, {
          method: "POST",
          body: JSON.stringify({ description: diagnosisDescription, icdCode: icdCode || undefined }),
        });
      }

      if (medication && dosage && frequency) {
        await apiRequest(`/visits/${visit.id}/prescriptions`, {
          method: "POST",
          body: JSON.stringify({ medication, dosage, frequency }),
        });
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this visit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>New visit — {patientName}</Text>

      <FormInput label="Chief complaint" value={chiefComplaint} onChangeText={setChiefComplaint} />
      <FormInput label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
      <FormInput label="Blood pressure" value={bloodPressure} onChangeText={setBloodPressure} placeholder="120/80" />
      <FormInput
        label="Heart rate (bpm)"
        value={heartRate}
        onChangeText={setHeartRate}
        keyboardType="numeric"
      />

      <Text style={styles.subheading}>Diagnosis (optional)</Text>
      <FormInput label="Description" value={diagnosisDescription} onChangeText={setDiagnosisDescription} />
      <FormInput label="ICD-10 code" value={icdCode} onChangeText={setIcdCode} placeholder="e.g. J06.9" />

      <Text style={styles.subheading}>Prescription (optional)</Text>
      <FormInput label="Medication" value={medication} onChangeText={setMedication} />
      <FormInput label="Dosage" value={dosage} onChangeText={setDosage} placeholder="e.g. 500mg" />
      <FormInput label="Frequency" value={frequency} onChangeText={setFrequency} placeholder="e.g. twice daily" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Save visit" onPress={onSubmit} loading={loading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  subheading: { fontSize: 13, fontWeight: "800", color: "#8A8F98", textTransform: "uppercase", marginBottom: 10, marginTop: 6 },
  error: { color: "#B3261E", marginBottom: 12 },
});
