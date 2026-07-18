import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';

interface AadhaarUploaderProps {
  label: string;
  value: string | undefined;
  onChange: (uri: string) => void;
}

export const AadhaarUploader: React.FC<AadhaarUploaderProps> = ({
  label,
  value,
  onChange,
}) => {
  const handleUpload = () => {
    // Simulate image picker selection
    const mockUri = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=400&auto=format&fit=crop';
    onChange(mockUri);
  };

  const handleClear = (e: any) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.box, value ? styles.boxSelected : null]}
        onPress={handleUpload}
        activeOpacity={0.8}
      >
        {value ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: value }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Ionicons name="trash" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="card-outline" size={28} color={colors.gold} />
            <Text style={styles.placeholderText}>Tap to Upload ID Proof Photo</Text>
            <Text style={styles.supportText}>Supports JPEG, PNG up to 5MB</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  box: {
    height: 120,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  boxSelected: {
    borderStyle: 'solid',
    borderColor: colors.gold,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  clearBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(211, 47, 47, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: 8,
  },
  supportText: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs - 1,
    marginTop: 4,
  },
});

export default AadhaarUploader;
