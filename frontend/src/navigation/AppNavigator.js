import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import EditAdminProfileScreen from '../screens/admin/EditAdminProfileScreen';
import CenterListScreen from '../screens/admin/CenterListScreen';
import AddCenterScreen from '../screens/admin/AddCenterScreen';
import EditCenterScreen from '../screens/admin/EditCenterScreen';
import FarmerListScreen from '../screens/admin/FarmerListScreen';
import AddFarmerScreen from '../screens/admin/AddFarmerScreen';
import EditFarmerScreen from '../screens/admin/EditFarmerScreen';
import FoodReportsScreen from '../screens/admin/FoodReportsScreen';
import EditFoodRecordScreen from '../screens/admin/EditFoodRecordScreen';
import CenterDetailScreen from '../screens/admin/CenterDetailScreen';
import RateChartScreen from '../screens/admin/RateChartScreen';
import AnnualBonusScreen from '../screens/admin/AnnualBonusScreen';
import SendSmsScreen from '../screens/admin/SendSmsScreen';
import CollectionHeadHomeScreen from '../screens/collectionHead/CenterHomeScreen';
import CollectionHeadFarmerListScreen from '../screens/collectionHead/FarmerListScreen';
import FoodEntryScreen from '../screens/collectionHead/FoodEntryScreen';
import FoodHistoryScreen from '../screens/collectionHead/FoodHistoryScreen';
import { ROLE_ADMIN, ROLE_COLLECTION_HEAD } from '../constants/roles';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const auth = useSelector((state) => state.auth);
  const user = auth.user;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === ROLE_ADMIN ? (
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
          <Stack.Screen name="FoodReports" component={FoodReportsScreen} />
          <Stack.Screen name="CenterDetail" component={CenterDetailScreen} />
          <Stack.Screen name="EditFoodRecord" component={EditFoodRecordScreen} />
          <Stack.Screen name="RateChart" component={RateChartScreen} />
          <Stack.Screen name="AnnualBonus" component={AnnualBonusScreen} />
          <Stack.Screen name="SendSms" component={SendSmsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="CollectionHeadHome" component={CollectionHeadHomeScreen} />
          <Stack.Screen name="CollectionHeadFarmers" component={CollectionHeadFarmerListScreen} />
          <Stack.Screen name="FoodEntry" component={FoodEntryScreen} />
          <Stack.Screen name="FoodHistory" component={FoodHistoryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
