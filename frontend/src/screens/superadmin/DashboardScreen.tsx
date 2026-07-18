import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "../../redux/store";
import apiClient from "../../services/apiClient";

const actions = [
  { label: "ADD HOSTEL", icon: "storefront-outline", target: "AdminHostels" },
  { label: "ADD OWNER", icon: "person-add-outline", target: "AdminOwners" },
  { label: "SETTINGS", icon: "settings-outline", target: "AdminProfile" },
] as const;

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const hostels = useAppSelector(state => state.hostels.hostels);
  const owners = useAppSelector(state => state.owners.owners);
  const logs = useAppSelector(state => state.logs.logs);
  const unreadCount = useAppSelector(state => state.logs.unreadCount);

  const [statsData, setStatsData] = React.useState({
    totalHostels: 0,
    totalOwners: 0,
    occupiedBeds: 0,
    monthlyRevenue: 0.0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/tenants/dashboard-stats');
        setStatsData({
          totalHostels: response.data.total_hostels,
          totalOwners: response.data.total_owners,
          occupiedBeds: response.data.occupied_beds,
          monthlyRevenue: response.data.monthly_revenue
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    fetchStats();
  }, [hostels, owners]); // Re-fetch when lists update

  const stats = [
    {
      label: "TOTAL HOSTELS",
      value: String(statsData.totalHostels),
      icon: "business-outline",
      trend: statsData.totalHostels > 0 ? "2.4%" : "0%",
    },
    { 
      label: "TOTAL OWNERS", 
      value: String(statsData.totalOwners), 
      icon: "people-outline", 
      trend: statsData.totalOwners > 0 ? "5.1%" : "0%" 
    },
    { 
      label: "OCCUPIED BEDS", 
      value: String(statsData.occupiedBeds), 
      icon: "bed-outline", 
      trend: statsData.occupiedBeds > 0 ? "12%" : "0%" 
    },
    {
      label: "MONTHLY\nREVENUE",
      value: statsData.monthlyRevenue > 0 
        ? `₹${(statsData.monthlyRevenue / 100000).toFixed(1)}L` 
        : "₹0",
      icon: "cash-outline",
      trend: statsData.monthlyRevenue > 0 ? "8%" : "0%",
    },
  ] as const;

  const go = (target: string) => {
    if (target === "AdminProfile")
      navigation.navigate("AdminProfile");
    else if (target === "AdminHostels")
      navigation.navigate("AdminHostels", { screen: "AddHostel", params: { fromDashboard: true } });
    else if (target === "AdminOwners")
      navigation.navigate("AdminOwners", { screen: "CreateOwner", params: { fromDashboard: true } });
    else navigation.navigate(target);
  };

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.headerAction}
        >
          <Ionicons name="menu" size={20} color="#EAB27E" />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={styles.headingTitle}>Dashboard</Text>
          <Text style={styles.headingSub}>Welcome back, Super Admin</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => navigation.navigate("AdminNotifications", { showBack: true })}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={19} color="#EAB27E" />
          {unreadCount > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={styles.statTop}>
                <View style={styles.statIcon}>
                  <Ionicons name={stat.icon} size={20} color="#E8A87C" />
                </View>
                <View style={styles.trend}>
                  <Ionicons name="trending-up-outline" size={11} color="#6FCF97" />
                  <Text style={styles.trendText}>{stat.trend}</Text>
                </View>
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.action}
              onPress={() => go(action.target)}
              activeOpacity={0.82}
            >
              <View style={styles.actionBox}>
                <Ionicons name={action.icon} size={21} color="#F0B17C" />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activities Section */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogs')} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {logs.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.activity}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={
                    item.action.includes('Register') || item.action.includes('Create')
                      ? 'add-circle-outline'
                      : item.action.includes('Logged')
                      ? 'log-in-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={16}
                  color="#A97840"
                />
              </View>
              <View style={styles.activityCopy}>
                <Text style={styles.activityText}>{item.action}</Text>
                <Text style={styles.activitySub}>by {item.userName}</Text>
              </View>
              <Text style={styles.activityTime}>{getTimeAgo(item.date)}</Text>
            </View>
          ))}
          {logs.length === 0 && (
            <View style={styles.emptyActivityContainer}>
              <Text style={styles.emptyActivityText}>No recent activities</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#15110F" },
  header: {
    minHeight: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2C251F",
  },
  headerAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heading: { flex: 1, marginLeft: 11 },
  headingTitle: { color: "#F5EAE2", fontSize: 21, fontWeight: "800" },
  headingSub: { color: "#D8C9C1", fontSize: 12, marginTop: 1 },
  notificationDot: {
    position: "absolute",
    right: 2,
    top: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F2AE7D",
    borderWidth: 1,
    borderColor: "#15110F",
  },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 21 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 19,
  },
  statCard: {
    width: "46.5%",
    height: 181,
    backgroundColor: "#211B17",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 29,
    padding: 24,
    justifyContent: "space-between",
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(232,168,124,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  trend: { flexDirection: "row", alignItems: "center", paddingTop: 3 },
  trendText: {
    color: "#6FCF97",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 2,
  },
  statLabel: {
    color: "#A8A29B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  statValue: { color: "#F5F1EC", fontSize: 25, fontWeight: "900", marginTop: -7 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 33,
    marginBottom: 18,
  },
  sectionTitle: { color: "#F4E8E1", fontSize: 18, fontWeight: "800" },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  action: { alignItems: "center", width: "22%" },
  actionBox: {
    height: 80,
    width: "100%",
    borderRadius: 23,
    backgroundColor: "#2B2521",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  actionText: {
    color: "#D8CBC4",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 9,
    textAlign: "center",
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 36,
    marginBottom: 15,
  },
  viewAllText: {
    color: "#EAB27E",
    fontSize: 12,
    fontWeight: "700",
  },
  activityList: {
    gap: 10,
  },
  activity: {
    minHeight: 49,
    borderRadius: 16,
    backgroundColor: "#201B18",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    height: 29,
    width: 29,
    borderRadius: 15,
    backgroundColor: "#2B241E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  activityCopy: { flex: 1 },
  activityText: { color: "#D8CEC9", fontSize: 10 },
  activitySub: { color: "#85776C", fontSize: 8, marginTop: 2 },
  activityTime: { color: "#9D9086", fontSize: 8 },
  emptyActivityContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyActivityText: {
    color: '#85776C',
    fontSize: 12,
  },
});