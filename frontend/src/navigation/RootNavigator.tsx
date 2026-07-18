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
    if (!owner) return [];
    return hostels.filter(h => owner.hostelsAssigned.includes(h.id) && h.isActive);
  }, [owner, hostels]);

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
