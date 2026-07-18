import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppDispatch } from '../redux/store';
import { logout } from '../redux/slices/authSlice';

// Screens
import DashboardScreen from '../screens/superadmin/DashboardScreen';
import HostelListScreen from '../screens/superadmin/HostelListScreen';
import HostelDetailsScreen from '../screens/superadmin/HostelDetailsScreen';
import AddHostelScreen from '../screens/superadmin/AddHostelScreen';
import OwnerListScreen from '../screens/superadmin/OwnerListScreen';
import OwnerDetailsScreen from '../screens/superadmin/OwnerDetailsScreen';
import CreateOwnerScreen from '../screens/superadmin/CreateOwnerScreen';
import ActivityLogScreen from '../screens/superadmin/ActivityLogScreen';
import ProfileScreen from '../screens/superadmin/ProfileScreen';
import NotificationsScreen from '../screens/superadmin/NotificationsScreen';

import { colors, typography } from '../theme';

// Param Lists
export type HostelStackParamList = {
  HostelList: undefined;
  HostelDetails: { hostelId: string };
  AddHostel: { hostelId?: string; newOwnerEmail?: string; fromDashboard?: boolean } | undefined;
};

export type OwnerStackParamList = {
  OwnerList: undefined;
  OwnerDetails: { ownerId: string };
  CreateOwner: { ownerId?: string; returnTo?: 'AddHostel' | 'HostelDetails'; hostelId?: string; fromDashboard?: boolean } | undefined;
};

export type SuperAdminDrawerParamList = {
  AdminDashboard: undefined;
  AdminHostels: undefined;
  AdminOwners: undefined;
  AdminLogs: undefined;
  AdminProfile: undefined;
  AdminNotifications: { showBack?: boolean } | undefined;
};

const HostelStack = createNativeStackNavigator<HostelStackParamList>();
const OwnerStack = createNativeStackNavigator<OwnerStackParamList>();
const Drawer = createDrawerNavigator<SuperAdminDrawerParamList>();

// Hostel Stack Navigator
const HostelStackNavigator = () => (
  <HostelStack.Navigator id="HostelStack" screenOptions={{ headerShown: false }}>
    <HostelStack.Screen name="HostelList" component={HostelListScreen} />
    <HostelStack.Screen name="HostelDetails" component={HostelDetailsScreen} />
    <HostelStack.Screen name="AddHostel" component={AddHostelScreen} />
  </HostelStack.Navigator>
);

// Owner Stack Navigator
const OwnerStackNavigator = () => (
  <OwnerStack.Navigator id="OwnerStack" screenOptions={{ headerShown: false }}>
    <OwnerStack.Screen name="OwnerList" component={OwnerListScreen} />
    <OwnerStack.Screen name="OwnerDetails" component={OwnerDetailsScreen} />
    <OwnerStack.Screen name="CreateOwner" component={CreateOwnerScreen} />
  </OwnerStack.Navigator>
);

// Custom Drawer Content
const CustomDrawerContent = (props: any) => {
  const dispatch = useAppDispatch();
  const activeRouteName = props.state.routes[props.state.index]?.name;

  const menu = [
    { label: 'Dashboard', icon: 'grid-outline', routeName: 'AdminDashboard', go: () => props.navigation.navigate('AdminDashboard') },
    { label: 'Hostel Management', icon: 'business-outline', routeName: 'AdminHostels', go: () => props.navigation.navigate('AdminHostels') },
    { label: 'Owner Management', icon: 'people-outline', routeName: 'AdminOwners', go: () => props.navigation.navigate('AdminOwners') },
    { label: 'Activity Log', icon: 'time-outline', routeName: 'AdminLogs', go: () => props.navigation.navigate('AdminLogs') },
    { label: 'Notifications', icon: 'notifications-outline', routeName: 'AdminNotifications', go: () => props.navigation.navigate('AdminNotifications') },
    { label: 'Settings', icon: 'settings-outline', routeName: 'AdminProfile', go: () => props.navigation.navigate('AdminProfile') },
  ];
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SA</Text>
        </View>
        <View style={styles.profileCopy}><View style={styles.nameRow}><Text style={styles.userName}>Super Admin</Text><Ionicons name="chevron-down" size={17} color="#F1E6DF" /></View><Text style={styles.userRole}>System Administrator</Text></View>
        {/* <View style={styles.bell}><Ionicons name="notifications-outline" size={21} color="#D8CDC6" /><View style={styles.bellDot} /></View> */}
      </View>
      <View style={styles.drawerList}>
        {menu.map((item) => {
          const isActive = activeRouteName === item.routeName;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={item.go}
              activeOpacity={0.82}
            >
              <Ionicons name={item.icon as any} size={21} color={isActive ? '#FFFFFF' : '#D7CBC4'} />
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={() => dispatch(logout())} style={styles.logoutBtn}><Ionicons name="log-out-outline" size={23} color="#F25757" /><Text style={styles.logoutLabel}>Logout</Text></TouchableOpacity>
    </DrawerContentScrollView>
  );
};

// Drawer Navigator (Root Super Admin Navigator)
export const SuperAdminNavigator = () => {
  return (
    <Drawer.Navigator
      id="SuperAdminDrawer"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#C69667',
        drawerActiveTintColor: colors.white,
        drawerInactiveTintColor: '#D7CBC4',
        drawerStyle: {
          backgroundColor: colors.card,
          width: 338,
        },
        drawerLabelStyle: {
          fontSize: typography.sizes.sm,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen name="AdminDashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      
      <Drawer.Screen name="AdminHostels" component={HostelStackNavigator} options={{ title: 'Hostel Management' }} />
      <Drawer.Screen name="AdminOwners" component={OwnerStackNavigator} options={{ title: 'Owner Management' }} />
      <Drawer.Screen name="AdminLogs" component={ActivityLogScreen} options={{ title: 'Activity Log' }} />
      <Drawer.Screen name="AdminNotifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Drawer.Screen
        name="AdminProfile"
        component={ProfileScreen}
        options={{
          title: 'Settings & Security',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.card,
    paddingTop: 11,
  },
  drawerHeader: {
    paddingHorizontal: 17,paddingBottom: 17,flexDirection:'row',alignItems:'center',
  },
  avatar: {
    width: 50,height: 50,borderRadius: 25,backgroundColor: '#C8996D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,borderColor: '#DAB087',
  },
  avatarText: {
    color: '#FFFFFF',fontSize: 20,
    fontWeight: typography.weights.bold,
  },
  userName: {
    color: '#F7F0EB',fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  userRole: {
    color: '#D2C4BB',fontSize: 12,marginTop: 2,
  },
  profileCopy:{flex:1,marginLeft:9},nameRow:{flexDirection:'row',alignItems:'center',gap:4},bell:{width:28,height:28,alignItems:'center',justifyContent:'center',position:'relative'},bellDot:{position:'absolute',top:2,right:2,width:7,height:7,borderRadius:4,backgroundColor:'#F3595B'},drawerList:{flex:1,paddingHorizontal:9,gap:5},menuItem:{height:43,borderRadius:16,flexDirection:'row',alignItems:'center',paddingHorizontal:11,gap:11},menuItemActive:{backgroundColor:'#C69667',shadowColor:'#C69667',shadowOpacity:.35,shadowRadius:8,elevation:6},menuLabel:{color:'#D7CBC4',fontSize:15,fontWeight:'600'},menuLabelActive:{color:'#FFFFFF',fontWeight:'700'},
  logoutBtn: {
    height:50,marginTop:10,borderTopWidth:1,borderTopColor:'#322B27',paddingHorizontal:19,flexDirection:'row',alignItems:'center',gap:12,
  },
  logoutLabel: {
    color: '#F25757',fontSize:15,fontWeight:'600',
  },
});

export default SuperAdminNavigator;
