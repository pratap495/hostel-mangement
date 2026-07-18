import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppSelector } from '../../redux/store';
import { HostelStackParamList } from '../../navigation/SuperAdminNavigator';
import HostelCard from '../../components/HostelCard';
import Header from '../../components/Header';
import { colors} from '../../theme';

type Props = NativeStackScreenProps<HostelStackParamList, 'HostelList'>;

export default function HostelListScreen({ navigation }: Props) {
  const hostels = useAppSelector(state => state.hostels.hostels);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredHostels = hostels.filter(hostel => {
    const matchesSearch = hostel.name.toLowerCase().includes(search.toLowerCase()) ||
      hostel.address.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && hostel.isActive) || 
      (filter === 'inactive' && !hostel.isActive);

    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Hostel Management"
        showDrawer
        onDrawer={() => (navigation as any).getParent()?.openDrawer()}
        alignLeft
      />
      <View style={styles.searchBarContainer}><View style={styles.searchField}><Ionicons name="search-outline" size={18} color="#B7A692" /><TextInput style={styles.searchInput} placeholder="Search hostel..." placeholderTextColor="#B7A692" value={search} onChangeText={setSearch} /></View><TouchableOpacity style={styles.filterBtn} onPress={() => setFilter(filter === 'all' ? 'active' : 'all')} activeOpacity={0.85}><Ionicons name="options-outline" size={20} color="#F5EEE8" /></TouchableOpacity></View>

      {/* List */}
      <FlatList
        data={filteredHostels}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HostelCard
            hostel={item}
            onPress={() => navigation.navigate('HostelDetails', { hostelId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color="#887C71" />
            <Text style={styles.emptyText}>No Hostels Found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search query.</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddHostel')}><Ionicons name="add" size={27} color="#FFFFFF" /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171210',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,paddingTop: 10,gap: 10,
  },
  searchField:{height:44,flex:1,borderRadius:14,backgroundColor:'#2A231D',borderWidth:1,borderColor:'#3B3028',flexDirection:'row',alignItems:'center',paddingHorizontal:15},searchInput:{flex:1,color:'#F5EDE7',fontSize:16,marginLeft:10},
  filterBtn: {
    backgroundColor: '#2A231D',borderWidth:1,borderColor:'#3B3028',width: 44,height: 44,borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,paddingTop: 14,
    paddingBottom: 78,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#F5EDE7',fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#887C71',fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
  fab:{position:'absolute',right:20,bottom:20,width:52,height:52,borderRadius:26,backgroundColor:'#D07A3B',alignItems:'center',justifyContent:'center',shadowColor:'#D07A3B',shadowOpacity:.5,shadowRadius:11,elevation:12},
});
