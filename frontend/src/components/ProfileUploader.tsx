import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, radius } from '../theme';

interface ProfileUploaderProps {
  value: string | undefined;
  onChange: (uri: string) => void;
}

export const ProfileUploader: React.FC<ProfileUploaderProps> = ({
  value,
  onChange,
}) => {
  const [picking, setPicking] = useState(false);

  const handleUpload = async () => {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission needed', 'Allow photo-library access to upload a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        onChange(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Upload unavailable', 'Unable to select a photo. Please try again.');
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={handleUpload}
        disabled={picking}
        activeOpacity={0.8}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={28} color={colors.gold} />
          </View>
        )}
        <View style={styles.editBadge}>
          <Ionicons name="pencil" size={12} color={colors.white} />
        </View>
      </TouchableOpacity>
      <Text style={styles.label}>Upload Profile Photo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: 'visible',
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

export default ProfileUploader;
