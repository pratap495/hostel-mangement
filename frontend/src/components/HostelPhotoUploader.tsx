import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, typography } from '../theme';

interface HostelPhotoUploaderProps {
  value: string;
  onChange: (uri: string) => void;
  error?: string;
}

export default function HostelPhotoUploader({ value, onChange, error }: HostelPhotoUploaderProps) {
  const [picking, setPicking] = useState(false);

  const pickPhoto = async () => {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Allow photo-library access to upload a hostel photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!result.canceled) onChange(result.assets[0].uri);
    } catch {
      Alert.alert('Upload unavailable', 'Unable to select a photo. Please try again.');
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Hostel Photo <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity style={[styles.upload, error && styles.uploadError]} onPress={pickPhoto} disabled={picking} activeOpacity={0.8}>
        {value ? <Image source={{ uri: value }} style={styles.image} /> : <View style={styles.placeholder}><Ionicons name="image-outline" size={30} color={colors.gold} /><Text style={styles.placeholderTitle}>Upload hostel photo</Text><Text style={styles.placeholderCopy}>Tap to choose an image</Text></View>}
        {value && <View style={styles.changeBadge}><Ionicons name="camera" size={16} color={colors.white} /><Text style={styles.changeText}>Change photo</Text></View>}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.helper}>A hostel image is required.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: 8 },
  required: { color: colors.error },
  upload: { height: 180, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, overflow: 'hidden', backgroundColor: colors.card },
  uploadError: { borderColor: colors.error },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderTitle: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginTop: 10 },
  placeholderCopy: { color: colors.textFaint, fontSize: typography.sizes.xs, marginTop: 4 },
  changeBadge: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm },
  changeText: { color: colors.white, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  helper: { color: colors.textFaint, fontSize: typography.sizes.xs, marginTop: 6 },
  error: { color: colors.error, fontSize: typography.sizes.xs, marginTop: 6 },
});
