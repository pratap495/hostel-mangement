import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { hostelService } from '../services/hostelService';

// Screens
import OwnerDashboardScreen from '../screens/owner/DashboardScreen';
import FoodMenuScreen from '../screens/owner/FoodMenuScreen';
import HostelerListScreen from '../screens/owner/HostelerListScreen';
import HostelerDetailsScreen from '../screens/owner/HostelerDetailsScreen';
import AddHostelerScreen from '../screens/owner/AddHostelerScreen';
import RoomListScreen from '../screens/owner/RoomListScreen';
import RoomDetailsScreen from '../screens/owner/RoomDetailsScreen';
import AllocateRoomScreen from '../screens/owner/AllocateRoomScreen';
import FinanceScreen from '../screens/owner/FinanceScreen';
import AddTransactionScreen from '../screens/owner/AddTransactionScreen';
import NotificationsScreen from '../screens/owner/NotificationsScreen';
import ProfileScreen from '../screens/owner/ProfileScreen';

import { colors, typography, radius } from '../theme';

// Param Lists
export type DashboardStackParamList = {
  DashboardOverview: undefined;
  FoodMenu: undefined;
};

export type HostelerStackParamList = {
  HostelerList: undefined;
  HostelerDetails: { hostelerId: string };
  AddHosteler: { hostelerId?: string} | undefined;
};

export type RoomStackParamList = {
  RoomList: undefined;
  RoomDetails: { roomId: string };
  AllocateRoom: { roomId?: string; hostelerId?: string } | undefined;
};

export type FinanceStackParamList = {
  FinanceOverview: undefined;
  AddTransaction: { type: 'income' | 'expense' };
};

export type OwnerTabParamList = {
  OwnerDashboard: undefined;
  OwnerHostelers: undefined;
  OwnerRooms: undefined;
  OwnerFinance: undefined;
};

export type OwnerDrawerParamList = {
  OwnerTabs: undefined;
  OwnerNotifications: undefined;
  OwnerProfile: undefined;
};

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const HostelerStack = createNativeStackNavigator<HostelerStackParamList>();
const RoomStack = createNativeStackNavigator<RoomStackParamList>();
const FinanceStack = createNativeStackNavigator<FinanceStackParamList>();
const Tab = createBottomTabNavigator<OwnerTabParamList>();
const Drawer = createDrawerNavigator<OwnerDrawerParamList>();

// Dashboard Stack
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator id="DashboardStack" screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardOverview" component={OwnerDashboardScreen} />
    <DashboardStack.Screen name="FoodMenu" component={FoodMenuScreen} />
  </DashboardStack.Navigator>
);

// Hosteler Stack
const HostelerStackNavigator = () => (
  <HostelerStack.Navigator id="HostelerStack" screenOptions={{ headerShown: false }}>
    <HostelerStack.Screen name="HostelerList" component={HostelerListScreen} />
    <HostelerStack.Screen name="HostelerDetails" component={HostelerDetailsScreen} />
    <HostelerStack.Screen name="AddHosteler" component={AddHostelerScreen} />
  </HostelerStack.Navigator>
);

// Room Stack
const RoomStackNavigator = () => (
  <RoomStack.Navigator id="RoomStack" screenOptions={{ headerShown: false }}>
    <RoomStack.Screen name="RoomList" component={RoomListScreen} />
    <RoomStack.Screen name="RoomDetails" component={RoomDetailsScreen} />
    <RoomStack.Screen name="AllocateRoom" component={AllocateRoomScreen} />
  </RoomStack.Navigator>
);

// Finance Stack
const FinanceStackNavigator = () => (
  <FinanceStack.Navigator id="FinanceStack" screenOptions={{ headerShown: false }}>
    <FinanceStack.Screen name="FinanceOverview" component={FinanceScreen} />
    <FinanceStack.Screen name="AddTransaction" component={AddTransactionScreen} />
  </FinanceStack.Navigator>
);

// Tab Navigator
const OwnerTabNavigator = () => {
  return (
    <Tab.Navigator
      id="OwnerTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';
          if (route.name === 'OwnerDashboard') iconName = 'grid-outline';
          else if (route.name === 'OwnerHostelers') iconName = 'people-outline';
          else if (route.name === 'OwnerRooms') iconName = 'bed-outline';
          else if (route.name === 'OwnerFinance') iconName = 'cash-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="OwnerDashboard"
        component={DashboardStackNavigator}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="OwnerHostelers"
        component={HostelerStackNavigator}
        options={{ title: 'Residents' }}
      />
      <Tab.Screen
        name="OwnerRooms"
        component={RoomStackNavigator}
        options={{ title: 'Rooms' }}
      />
      <Tab.Screen
        name="OwnerFinance"
        component={FinanceStackNavigator}
        options={{ title: 'Finance' }}
      />
    </Tab.Navigator>
  );
};

// Custom Drawer Content (Includes Hostel Switcher)
const CustomDrawerContent = (props: any) => {
  const dispatch = useAppDispatch();
  const { user, activeHostelId } = useAppSelector(state => state.auth);
  const hostels = useAppSelector(state => state.hostels.hostels);
  
  // Find hostels assigned to this owner
  const assignedHostels = hostels.filter(
    h => user?.role === 'owner' && h.isActive && user.hostelsAssigned?.includes(h.id)
  );
  const activeHostel = hostels.find(h => h.id === activeHostelId);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'OW'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Hostel Owner'}</Text>
        <Text style={styles.userRole}>Hostel Operations Owner</Text>
      </View>

      {/* Hostel Switcher Section */}
      {assignedHostels.length > 0 && (
        <View style={styles.switcherSection}>
          <Text style={styles.switcherLabel}>Active Hostel</Text>
          {assignedHostels.map(hostel => {
            const isActive = hostel.id === activeHostelId;
            return (
              <TouchableOpacity
                key={hostel.id}
                style={[
                  styles.hostelSelectItem,
                  isActive ? styles.hostelSelectItemActive : styles.hostelSelectItemInactive,
                ]}
                onPress={() => {
                  hostelService.selectActiveHostel(hostel.id);
                  props.navigation.closeDrawer();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={isActive ? colors.gold : colors.textMuted}
                />
                <Text
                  style={[
                    styles.hostelSelectText,
                    isActive && styles.hostelSelectTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {hostel.name}
                </Text>
                {isActive ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.gold} style={styles.checkIcon} />
                ) : (
                  <Ionicons name="chevron-forward-outline" size={14} color={colors.textFaint} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.drawerList}>
        <DrawerItemList {...props} />
      </View>
      <DrawerItem
        label="Log Out"
        labelStyle={styles.logoutLabel}
        icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={colors.error} />}
        onPress={() => dispatch(logout())}
        style={styles.logoutBtn}
      />
    </DrawerContentScrollView>
  );
};

// Owner Drawer Navigator
export const OwnerNavigator = () => {
  return (
    <Drawer.Navigator
      id="OwnerDrawer"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: 'rgba(199, 150, 42, 0.08)',
        drawerActiveTintColor: colors.gold,
        drawerInactiveTintColor: colors.textMuted,
        drawerStyle: {
          backgroundColor: colors.card,
          width: 270,
        },
        drawerLabelStyle: {
          fontSize: typography.sizes.sm,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="OwnerTabs"
        component={OwnerTabNavigator}
        options={{
          title: 'Hostel Manager',
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="OwnerNotifications"
        component={NotificationsScreen}
        options={{
          title: 'Alerts & Messages',
          drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="OwnerProfile"
        component={ProfileScreen}
        options={{
          title: 'Account Settings',
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
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(199, 150, 42, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    marginBottom: 12,
  },
  avatarText: {
    color: colors.gold,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  userName: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  userRole: {
    color: colors.textFaint,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  switcherSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  switcherLabel: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  hostelSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginBottom: 4,
    gap: 10,
  },
  hostelSelectItemActive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  hostelSelectItemInactive: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  hostelSelectText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  hostelSelectTextActive: {
    color: colors.gold,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  drawerList: {
    flex: 1,
    paddingTop: 8,
  },
  logoutBtn: {
    marginTop: 'auto',
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 15,
  },
  logoutLabel: {
    color: colors.error,
    fontWeight: '600',
  },
});

export default OwnerNavigator;
