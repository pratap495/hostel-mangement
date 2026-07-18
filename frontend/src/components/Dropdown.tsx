import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  items: DropdownItem[];
  selectedValue: string | null;
  onValueChange: (value: string) => void;
  error?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder = 'Select an item',
  items,
  selectedValue,
  onValueChange,
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find(item => item.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dropdownBox, error ? styles.dropdownError : null]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.selectedText,
            !selectedItem && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down-outline"
          size={18}
          color={colors.gold}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label || 'Select'}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-outline" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={items}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.itemRow,
                        item.value === selectedValue && styles.itemSelectedRow,
                      ]}
                      onPress={() => handleSelect(item.value)}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          item.value === selectedValue && styles.itemSelectedText,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.value === selectedValue && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.gold}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: 16,
  },
  dropdownError: {
    borderColor: colors.error,
  },
  selectedText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  placeholderText: {
    color: colors.textFaint,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '65%',
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  modalTitle: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
  },
  itemSelectedRow: {
    backgroundColor: 'rgba(199, 150, 42, 0.08)',
  },
  itemText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
  itemSelectedText: {
    color: colors.gold,
    fontWeight: typography.weights.semibold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
});

export default Dropdown;
