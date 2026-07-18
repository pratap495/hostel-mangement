import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { setActiveHostel } from '../redux/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import OwnerNavigator from './OwnerNavigator';
import HostelSelectionScreen from '../screens/auth/HostelSelectionScreen';
import NoHostelsScreen from '../screens/auth/NoHostelsScreen';
import { colors } from '../theme';
import { hostelService } from '../services/hostelService';
import { ownerService } from '../services/ownerService';
import { roomService } from '../services/roomService';
import { hostelerService } from '../services/hostelerService';
import { financeService } from '../services/financeService';
import { notificationService } from '../services/notificationService';

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, activeRole, activeHostelId, user, loading, hasLoggedOut } = useAppSelector(state => state.auth);
  const owners = useAppSelector(state => state.owners.owners);
  const hostels = useAppSelector(state => state.hostels.hostels);

  const owner = React.useMemo(() => {
    if (!user || activeRole !== 'owner') return null;
    return owners.find(o => o.email.trim().toLowerCase() === user.email.trim().toLowerCase());
  }, [user, activeRole, owners]);

  const assignedHostels = React.useMemo(() => {
    if (activeRole === 'owner') {
      // Backend already filters GET /tenants/hostels to only the owner's assigned hostels,
      // so we can use the full hostels list directly without depending on the owners slice
      // (which is Super Admin only and returns 403 for owner-role requests).
      return hostels.filter(h => h.isActive);
    }
    if (!owner) return [];
    return hostels.filter(h => owner.hostelsAssigned.includes(h.id) && h.isActive);
  }, [owner, hostels, activeRole]);

  // Automatically fetch live backend data on login or hostel switch
  React.useEffect(() => {
    if (isAuthenticated) {
      if (activeRole === 'super_admin') {
        hostelService.getHostels();
        ownerService.getOwners();
      } else if (activeRole === 'owner') {
        hostelService.getHostels(); // Returns only this owner's hostels (filtered by backend)
        if (activeHostelId) {
          roomService.getRooms();
          hostelerService.getHostelers();
          financeService.getTransactions();
          notificationService.getNotifications();
        }
      }
    }
  }, [isAuthenticated, activeRole, activeHostelId]);

  React.useEffect(() => {
    if (activeRole === 'owner' && assignedHostels.length === 1 && !activeHostelId) {
      dispatch(setActiveHostel(assignedHostels[0].id));
    }
  }, [activeRole, assignedHostels, activeHostelId, dispatch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator initialRouteName={hasLoggedOut ? 'LoginForm' : 'Splash'} />;
  }

  if (activeRole === 'super_admin') {
    return <SuperAdminNavigator />;
  }

  if (activeRole === 'owner') {
    if (assignedHostels.length === 0) {
      return <NoHostelsScreen />;
    }
    if (assignedHostels.length >= 2 && !activeHostelId) {
      return <HostelSelectionScreen hostels={assignedHostels} />;
    }
    return <OwnerNavigator />;
  }

  return <AuthNavigator initialRouteName="LoginForm" />;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
