import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { OwnerStackParamList } from '../../navigation/SuperAdminNavigator';
import Header from '../../components/Header';
import OwnerCard from '../../components/OwnerCard';
import TextInput from '../../components/TextInput';
import { colors, typography, radius } from '../../theme';

type Props = NativeStackScreenProps<OwnerStackParamList, 'OwnerList'>;

export default function OwnerListScreen({ navigation }: Props) {
  const owners = useAppSelector(state => state.owners.owners);
  const [search, setSearch] = useState('');

  const filteredOwners = owners.filter(owner => {
    return owner.name.toLowerCase().includes(search.toLowerCase()) ||
      owner.email.toLowerCase().includes(search.toLowerCase()) ||
      owner.phone.includes(search);
  });

  return (
    <View style={styles.container}>
      <Header
        title="Owners Manager"
        showDrawer
        onDrawer={() => (navigation as any).getParent()?.openDrawer()}
        alignLeft
      />

      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="Search owner accounts..."
          iconName="search-outline"
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchField}
        />
        
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateOwner')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOwners}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OwnerCard
            owner={item}
            onPress={() => navigation.navigate('OwnerDetails', { ownerId: item.id })}
            onEditPress={() => navigation.navigate('CreateOwner', { ownerId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No Owners Found</Text>
            <Text style={styles.emptySubtext}>Try another search query.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchField: {
    flex: 1,
    marginBottom: 0,
  },
  addBtn: {
    backgroundColor: colors.gold,
    width: 52,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 16,
  },
  emptySubtext: {
    color: colors.textFaint,
    fontSize: typography.sizes.sm,
    marginTop: 6,
    textAlign: 'center',
  },
});
