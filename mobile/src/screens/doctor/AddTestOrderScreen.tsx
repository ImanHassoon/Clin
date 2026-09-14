import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiRequest, ApiError } from "../../api/client";
import type { TestOrder } from "../../types";
import type { DoctorPatientsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DoctorPatientsStackParamList, "AddTestOrder">;

export function AddTestOrderScreen({ route, navigation }: Props) {
  const { visitId } = route.params;
  const [testType, setTestType] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { testOrder } = await apiRequest<{ testOrder: TestOrder }>(`/visits/${visitId}/test-orders`, {
        method: "POST",
        body: JSON.stringify({ testType }),
      });

      if (resultSummary) {
        await apiRequest(`/test-orders/${testOrder.id}/results`, {
          method: "POST",
          body: JSON.stringify({ resultSummary }),
        });
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this test order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Order a test</Text>
      <FormInput label="Test type" value={testType} onChangeText={setTestType} placeholder="e.g. CBC, Blood glucose" />
      <FormInput
        label="Result summary (optional — fill in once results are back)"
        value={resultSummary}
        onChangeText={setResultSummary}
        multiline
        numberOfLines={3}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="Save" onPress={onSubmit} loading={loading} disabled={!testType} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  error: { color: "#B3261E", marginBottom: 12 },
});
