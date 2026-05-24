import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';

// Admin
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import EditAdminProfileScreen from '../screens/admin/EditAdminProfileScreen';
import CenterListScreen from '../screens/admin/CenterListScreen';
import AddCenterScreen from '../screens/admin/AddCenterScreen';
import EditCenterScreen from '../screens/admin/EditCenterScreen';
import FarmerListScreen from '../screens/admin/FarmerListScreen';
import AddFarmerScreen from '../screens/admin/AddFarmerScreen';
import EditFarmerScreen from '../screens/admin/EditFarmerScreen';
import FarmerDetailScreen from '../screens/admin/FarmerDetailScreen';
import FoodReportsScreen from '../screens/admin/FoodReportsScreen';
import FoodDetailScreen from '../screens/admin/FoodDetailScreen';
import EditFoodRecordScreen from '../screens/admin/EditFoodRecordScreen';
import CenterDetailScreen from '../screens/admin/CenterDetailScreen';
import CollectionDetailScreen from '../screens/admin/CollectionDetailScreen';
import RateChartScreen from '../screens/admin/RateChartScreen';
import AnnualBonusScreen from '../screens/admin/AnnualBonusScreen';
import SendNotificationScreen from '../screens/admin/SendNotificationScreen';
import CollectionRecordsScreen from '../screens/admin/CollectionRecordsScreen';
import AllPaysScreen from '../screens/admin/AllPaysScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import FarmerLoginManagementScreen from '../screens/admin/FarmerLoginManagementScreen';

// Collection Head
import CollectionHeadHomeScreen from '../screens/collectionHead/CenterHomeScreen';
import CollectionHeadFarmerListScreen from '../screens/collectionHead/FarmerListScreen';
import FoodEntryScreen from '../screens/collectionHead/FoodEntryScreen';
import FoodHistoryScreen from '../screens/collectionHead/FoodHistoryScreen';
import MilkEntryScreen from '../screens/collectionHead/MilkEntryScreen';
import CollectionHeadAllPaysScreen from '../screens/collectionHead/AllPaysScreen';

// Farmer
import FarmerDashboardScreen from '../screens/farmer/FarmerDashboardScreen';
import FarmerMilkScreen from '../screens/farmer/FarmerMilkScreen';
import FarmerFoodScreen from '../screens/farmer/FarmerFoodScreen';
import FarmerNotificationsScreen from '../screens/farmer/FarmerNotificationsScreen';
import FarmerNotificationDetailScreen from '../screens/farmer/FarmerNotificationDetailScreen';
import FarmerReportScreen from '../screens/farmer/FarmerReportScreen';

import { ROLE_ADMIN, ROLE_COLLECTION_HEAD, ROLE_FARMER } from '../constants/roles';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // ── Unauthenticated ──────────────────────────────────────────────────
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === ROLE_ADMIN ? (
        // ── Admin ────────────────────────────────────────────────────────────
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
          <Stack.Screen name="EditAdminProfile" component={EditAdminProfileScreen} />
          <Stack.Screen name="CenterList" component={CenterListScreen} />
          <Stack.Screen name="AddCenter" component={AddCenterScreen} />
          <Stack.Screen name="EditCenter" component={EditCenterScreen} />
          <Stack.Screen name="FarmerList" component={FarmerListScreen} />
          <Stack.Screen name="AddFarmer" component={AddFarmerScreen} />
          <Stack.Screen name="EditFarmer" component={EditFarmerScreen} />
          <Stack.Screen name="FarmerDetail" component={FarmerDetailScreen} />
          <Stack.Screen name="FoodReports" component={FoodReportsScreen} />
          <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
          <Stack.Screen name="CenterDetail" component={CenterDetailScreen} />
          <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
          <Stack.Screen name="EditFoodRecord" component={EditFoodRecordScreen} />
          <Stack.Screen name="RateChart" component={RateChartScreen} />
          <Stack.Screen name="AnnualBonus" component={AnnualBonusScreen} />
          <Stack.Screen name="SendNotification" component={SendNotificationScreen} />
          <Stack.Screen name="CollectionRecords" component={CollectionRecordsScreen} />
          <Stack.Screen name="AllPays" component={AllPaysScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="FarmerLoginManagement" component={FarmerLoginManagementScreen} />
        </>
      ) : user.role === ROLE_COLLECTION_HEAD ? (
        // ── Collection Head ──────────────────────────────────────────────────
        <>
          <Stack.Screen name="CollectionHeadHome" component={CollectionHeadHomeScreen} />
          <Stack.Screen name="CollectionHeadFarmers" component={CollectionHeadFarmerListScreen} />
          <Stack.Screen name="FoodEntry" component={FoodEntryScreen} />
          <Stack.Screen name="FoodHistory" component={FoodHistoryScreen} />
          <Stack.Screen name="MilkEntry" component={MilkEntryScreen} />
          <Stack.Screen name="AllPays" component={CollectionHeadAllPaysScreen} />
        </>
      ) : user.role === ROLE_FARMER ? (
        // ── Farmer ───────────────────────────────────────────────────────────
        <>
          <Stack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} />
          <Stack.Screen name="FarmerMilk" component={FarmerMilkScreen} />
          <Stack.Screen name="FarmerFood" component={FarmerFoodScreen} />
          <Stack.Screen name="FarmerNotifications" component={FarmerNotificationsScreen} />
          <Stack.Screen name="FarmerNotificationDetail" component={FarmerNotificationDetailScreen} />
          <Stack.Screen name="FarmerReport" component={FarmerReportScreen} />
        </>
      ) : (
        // ── Fallback (unknown role) ───────────────────────────────────────────
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
