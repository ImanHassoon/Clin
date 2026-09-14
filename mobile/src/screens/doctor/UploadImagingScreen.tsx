import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenContainer } from "../../components/ScreenContainer";
import { FormInput } from "../../components/FormInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiUpload, ApiError } from "../../api/client";
import type { DoctorPatientsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DoctorPatientsStackParamList, "UploadImaging">;

const IMAGING_TYPES = ["XRAY", "CT", "MRI", "ULTRASOUND", "OTHER"] as const;

export function UploadImagingScreen({ route, navigation }: Props) {
  const { visitId } = route.params;
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [type, setType] = useState<(typeof IMAGING_TYPES)[number]>("XRAY");
  const [bodyPart, setBodyPart] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required to attach an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setAsset(result.assets[0]);
      setError(null);
    }
  };

  const onSubmit = async () => {
    if (!asset) {
      setError("Attach an image first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("visitId", visitId);
      form.append("type", type);
      if (bodyPart) form.append("bodyPart", bodyPart);
      if (notes) form.append("notes", notes);
      form.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "upload.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);

      await apiUpload("/imaging", form);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload this image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Upload imaging</Text>

      <TouchableOpacity style={styles.picker} onPress={pickImage}>
        {asset ? (
          <Image source={{ uri: asset.uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <Text style={styles.pickerText}>Tap to choose an image</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {IMAGING_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, type === t && styles.typeChipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormInput label="Body part" value={bodyPart} onChangeText={setBodyPart} placeholder="e.g. Chest, Left wrist" />
      <FormInput label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton title="Upload" onPress={onSubmit} loading={loading} disabled={!asset} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: "#1B5E63", marginBottom: 16 },
  picker: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DBDF",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  pickerText: { color: "#8A8F98" },
  preview: { width: "100%", height: "100%" },
  label: { fontSize: 13, fontWeight: "600", color: "#3A3F44", marginBottom: 6 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#D7DBDF" },
  typeChipActive: { backgroundColor: "#1B5E63", borderColor: "#1B5E63" },
  typeChipText: { color: "#3A3F44", fontWeight: "600", fontSize: 12 },
  typeChipTextActive: { color: "#fff" },
  error: { color: "#B3261E", marginBottom: 12 },
});
