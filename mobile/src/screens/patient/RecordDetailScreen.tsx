import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "../../components/Card";
import { apiRequest } from "../../api/client";
import type { Document, ImagingStudy } from "../../types";
import type { PatientRecordsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<PatientRecordsStackParamList, "RecordDetail">;

function ImagingCard({ study }: { study: ImagingStudy }) {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [fullScreenUrl, setFullScreenUrl] = useState<string | null>(null);

  useEffect(() => {
    // Signed URLs are only ever fetched on demand, never cached from a list
    // response, and expire a few minutes after this call.
    apiRequest<{ study: ImagingStudy }>(`/imaging/${study.id}`)
      .then((data) => setDocuments(data.study.documents))
      .catch(() => setDocuments([]));
  }, [study.id]);

  return (
    <Card>
      <Text style={styles.imagingType}>
        {study.type} {study.bodyPart ? `— ${study.bodyPart}` : ""}
      </Text>
      {study.notes ? <Text style={styles.imagingNotes}>{study.notes}</Text> : null}

      {documents === null ? (
        <ActivityIndicator style={styles.thumbLoading} />
      ) : (
        <View style={styles.thumbRow}>
          {documents
            .filter((d) => d.mimeType.startsWith("image/") && d.url)
            .map((d) => (
              <TouchableOpacity key={d.id} onPress={() => setFullScreenUrl(d.url!)}>
                <Image source={{ uri: d.url }} style={styles.thumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
        </View>
      )}

      <Modal visible={!!fullScreenUrl} transparent onRequestClose={() => setFullScreenUrl(null)}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setFullScreenUrl(null)} activeOpacity={1}>
          {fullScreenUrl && <Image source={{ uri: fullScreenUrl }} style={styles.fullImage} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
    </Card>
  );
}

export function RecordDetailScreen({ route }: Props) {
  const { visit } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>{new Date(visit.visitDate).toLocaleString()}</Text>
      <Text style={styles.chiefComplaint}>{visit.chiefComplaint || "General visit"}</Text>
      {visit.notes ? (
        <Card>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{visit.notes}</Text>
        </Card>
      ) : null}

      {visit.diagnoses.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Diagnoses</Text>
          {visit.diagnoses.map((d) => (
            <Text key={d.id} style={styles.lineItem}>
              • {d.description} {d.icdCode ? `(${d.icdCode})` : ""}
            </Text>
          ))}
        </Card>
      )}

      {visit.prescriptions.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Prescriptions</Text>
          {visit.prescriptions.map((p) => (
            <Text key={p.id} style={styles.lineItem}>
              • {p.medication} — {p.dosage}, {p.frequency}
            </Text>
          ))}
        </Card>
      )}

      {visit.testOrders.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Test results</Text>
          {visit.testOrders.map((t) => (
            <Text key={t.id} style={styles.lineItem}>
              • {t.testType} — {t.status}
              {t.result?.resultSummary ? `: ${t.result.resultSummary}` : ""}
            </Text>
          ))}
        </Card>
      )}

      {visit.imagingStudies.map((study) => (
        <ImagingCard key={study.id} study={study} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F7F8FA" },
  date: { fontSize: 13, color: "#5B6168" },
  chiefComplaint: { fontSize: 20, fontWeight: "800", color: "#1B5E63", marginTop: 2, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: "#8A8F98", textTransform: "uppercase", marginBottom: 6 },
  notes: { color: "#3A3F44" },
  lineItem: { color: "#1A1D1F", marginBottom: 2 },
  imagingType: { fontSize: 16, fontWeight: "700", color: "#1A1D1F" },
  imagingNotes: { color: "#5B6168", marginTop: 2, marginBottom: 8 },
  thumbLoading: { marginTop: 8 },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  thumb: { width: 90, height: 90, borderRadius: 8, backgroundColor: "#EBEDEF" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  fullImage: { width: "100%", height: "100%" },
});
