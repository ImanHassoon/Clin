import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { apiRequest } from "../../api/client";
import type { Consent } from "../../types";

export function ConsentScreen() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiRequest<{ consents: Consent[] }>("/consents");
    setConsents(data.consents.filter((c) => !c.revokedAt));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  };

  const revoke = (consent: Consent) => {
    Alert.alert(
      "Revoke access?",
      `Dr. ${consent.doctor?.user.firstName} ${consent.doctor?.user.lastName} will no longer be able to see your records.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            await apiRequest(`/consents/${consent.id}`, { method: "DELETE" });
            load();
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer scroll={false}>
      <Text style={styles.title}>Who has access</Text>
      <Text style={styles.subtitle}>
        Confirming an appointment with a doctor grants them access to your records. Revoke it any time.
      </Text>
      <FlatList
        data={consents}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No active access grants.</Text>}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>
                  Dr. {item.doctor?.user.firstName} {item.doctor?.user.lastName}
                </Text>
                <Text style={styles.specialty}>{item.doctor?.specialty}</Text>
              </View>
              <TouchableOpacity onPress={() => revoke(item)}>
                <Text style={styles.revoke}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: "#1B5E63", marginBottom: 6 },
  subtitle: { color: "#5B6168", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700", color: "#1A1D1F" },
  specialty: { color: "#5B6168", marginTop: 2 },
  revoke: { color: "#B3261E", fontWeight: "700" },
  empty: { color: "#8A8F98", textAlign: "center", marginTop: 40 },
});
