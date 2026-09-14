import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiRequest } from "../../api/client";
import type { Visit } from "../../types";
import type { DoctorPatientsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DoctorPatientsStackParamList, "PatientDetail">;

export function PatientDetailScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params;
  const [visits, setVisits] = useState<Visit[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiRequest<{ visits: Visit[] }>(`/patients/${patientId}/visits`);
    setVisits(data.visits);
  }, [patientId]);

  useEffect(() => {
    navigation.setOptions({ title: patientName });
    load();
  }, [load, navigation, patientName]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <ScreenContainer scroll={false}>
      <PrimaryButton
        title="+ New visit"
        onPress={() => navigation.navigate("CreateVisit", { patientId, patientName })}
        style={styles.newVisit}
      />

      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No visits recorded yet.</Text>}
        renderItem={({ item }) => {
          const isOpen = expanded === item.id;
          return (
            <Card>
              <TouchableOpacity onPress={() => setExpanded(isOpen ? null : item.id)}>
                <Text style={styles.visitDate}>{new Date(item.visitDate).toLocaleString()}</Text>
                <Text style={styles.chiefComplaint}>{item.chiefComplaint || "No chief complaint recorded"}</Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.detail}>
                  {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

                  <Section title="Diagnoses">
                    {item.diagnoses.length === 0 && <Text style={styles.muted}>None recorded</Text>}
                    {item.diagnoses.map((d) => (
                      <Text key={d.id} style={styles.lineItem}>
                        • {d.description} {d.icdCode ? `(${d.icdCode})` : ""}
                      </Text>
                    ))}
                  </Section>

                  <Section title="Test orders">
                    {item.testOrders.length === 0 && <Text style={styles.muted}>None recorded</Text>}
                    {item.testOrders.map((t) => (
                      <Text key={t.id} style={styles.lineItem}>
                        • {t.testType} — {t.status}
                        {t.result?.resultSummary ? `: ${t.result.resultSummary}` : ""}
                      </Text>
                    ))}
                    <TouchableOpacity onPress={() => navigation.navigate("AddTestOrder", { visitId: item.id })}>
                      <Text style={styles.addLink}>+ Order test</Text>
                    </TouchableOpacity>
                  </Section>

                  <Section title="Imaging">
                    {item.imagingStudies.length === 0 && <Text style={styles.muted}>None recorded</Text>}
                    {item.imagingStudies.map((img) => (
                      <Text key={img.id} style={styles.lineItem}>
                        • {img.type} {img.bodyPart ? `— ${img.bodyPart}` : ""} ({img.documents.length} file
                        {img.documents.length === 1 ? "" : "s"})
                      </Text>
                    ))}
                    <TouchableOpacity onPress={() => navigation.navigate("UploadImaging", { visitId: item.id })}>
                      <Text style={styles.addLink}>+ Upload imaging</Text>
                    </TouchableOpacity>
                  </Section>

                  <Section title="Prescriptions">
                    {item.prescriptions.length === 0 && <Text style={styles.muted}>None recorded</Text>}
                    {item.prescriptions.map((p) => (
                      <Text key={p.id} style={styles.lineItem}>
                        • {p.medication} — {p.dosage}, {p.frequency}
                      </Text>
                    ))}
                  </Section>
                </View>
              )}
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  newVisit: { marginBottom: 14 },
  visitDate: { fontSize: 13, color: "#5B6168" },
  chiefComplaint: { fontSize: 16, fontWeight: "700", color: "#1A1D1F", marginTop: 2 },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#EBEDEF", paddingTop: 12 },
  notes: { color: "#3A3F44", marginBottom: 10 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#8A8F98", textTransform: "uppercase", marginBottom: 4 },
  lineItem: { color: "#1A1D1F", marginBottom: 2 },
  muted: { color: "#8A8F98" },
  addLink: { color: "#1B5E63", fontWeight: "700", marginTop: 4 },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
