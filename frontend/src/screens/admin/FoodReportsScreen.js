import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { fetchFoodRecords, deleteFoodRecord } from '../../redux/slices/foodSlice';
import { LoadingIndicator, EmptyState, SearchBar } from '../../components';
import styles from './adminStyles';

const isWithinDateRange = (dateValue, range) => {
  if (!range) return true;
  if (!dateValue) return false;

  const now = new Date();
  const recordDate = new Date(dateValue);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  if (range === 'today') {
    return recordDate >= todayStart && recordDate < tomorrowStart;
  }

  if (range === 'yesterday') {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    return recordDate >= yesterdayStart && recordDate < todayStart;
  }

  if (range === 'lastWeek') {
    const lastWeekStart = new Date(todayStart);
    lastWeekStart.setDate(todayStart.getDate() - 7);
    return recordDate >= lastWeekStart && recordDate < tomorrowStart;
  }

  if (range === 'lastMonth') {
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return recordDate >= firstDayLastMonth && recordDate < firstDayCurrentMonth;
  }

  return true;
};

const isMatchingPayment = (paymentStatus, filterValue) => {
  if (!filterValue) return true;
  const normalized = (paymentStatus || '').toLowerCase();

  if (filterValue === 'Paid') {
    return normalized === 'paid';
  }

  if (filterValue === 'Unpaid') {
    return normalized !== 'paid';
  }

  return true;
};

const FoodReportsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const foodRecords = useSelector((state) => state.food.records);
  const status = useSelector((state) => state.food.status);

  const selectedCenterId = route?.params?.centerId || '';
  const selectedCenterName = route?.params?.centerName || '';

  const [filters, setFilters] = useState({
    center: selectedCenterId,
    dateRange: '',
    paymentStatus: '',
    animalType: '',
    foodType: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [dispatch, token, filters.center, filters.animalType, filters.foodType]);

  useEffect(() => {
    if (selectedCenterId) {
      setFilters((prev) => ({ ...prev, center: selectedCenterId }));
    }
  }, [selectedCenterId]);

  const loadData = () => {
    const params = {};
    if (filters.center) params.center = filters.center;
    if (filters.animalType) params.animalType = filters.animalType;
    if (filters.foodType) params.foodType = filters.foodType;
    dispatch(fetchFoodRecords({ token, params }));
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this food record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteFoodRecord({ id, token })).unwrap();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Record deleted successfully',
                position: 'top',
                visibilityTime: 3000,
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error,
                position: 'top',
                visibilityTime: 4000,
              });
            }
          }
        }
      ]
    );
  };

  const filteredRecords = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return foodRecords.filter((record) => {
      const farmerName = record.farmerId?.fullName?.toLowerCase() || '';
      const centerName = record.collectionCenterId?.name?.toLowerCase() || '';
      const searchMatched = !search || farmerName.includes(search) || centerName.includes(search);
      const dateMatched = isWithinDateRange(record.date, filters.dateRange);
      const paymentMatched = isMatchingPayment(record.paymentStatus, filters.paymentStatus);
      return searchMatched && dateMatched && paymentMatched;
    });
  }, [foodRecords, searchQuery, filters.dateRange, filters.paymentStatus]);

  const totalAmount = filteredRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
  const totalQuantity = filteredRecords.reduce((sum, record) => sum + (record.quantity || 0), 0);
  const totalRecords = filteredRecords.length;

  const renderRecordItem = ({ item }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.farmerName}>{item.farmerId?.fullName}</Text>
        <Text style={styles.centerName}>{item.collectionCenterId?.name}</Text>
      </View>
      <View style={styles.recordDetails}>
        <Text>Animal: {item.animalType}</Text>
        <Text>Food: {item.foodType}</Text>
        <Text>Quantity: {item.quantity} {item.unit}</Text>
        <Text>Rate: ₹{item.rate}</Text>
        <Text>Total: ₹{item.totalAmount}</Text>
        <Text>Status: {item.paymentStatus}</Text>
        <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.recordActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditFoodRecord', { record: item })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item._id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (status === 'loading') {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Records</Text>
          <Text style={styles.summaryValue}>{totalRecords}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Quantity</Text>
          <Text style={styles.summaryValue}>{totalQuantity}</Text>
        </View>
      </View>

      {selectedCenterId ? (
        <View style={styles.selectedCenterBanner}>
          <Text style={styles.selectedCenterLabel}>Viewing food records for center:</Text>
          <Text style={styles.selectedCenterValue}>{selectedCenterName || 'Selected Center'}</Text>
        </View>
      ) : null}

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Date</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.dateRange}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All Dates" value="" />
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Yesterday" value="yesterday" />
              <Picker.Item label="Last Week" value="lastWeek" />
              <Picker.Item label="Last Month" value="lastMonth" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Payment</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.paymentStatus}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, paymentStatus: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All" value="" />
              <Picker.Item label="Paid" value="Paid" />
              <Picker.Item label="Unpaid" value="Unpaid" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Animal Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.animalType}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, animalType: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All" value="" />
              <Picker.Item label="Cow" value="Cow" />
              <Picker.Item label="Buffalo" value="Buffalo" />
            </Picker>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Food Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filters.foodType}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, foodType: value }))}
              style={styles.picker}
            >
              <Picker.Item label="All" value="" />
              <Picker.Item label="Cattle Feed" value="Cattle Feed" />
              <Picker.Item label="Buffalo Feed" value="Buffalo Feed" />
              <Picker.Item label="Mineral Mix" value="Mineral Mix" />
              <Picker.Item label="Dry Fodder" value="Dry Fodder" />
              <Picker.Item label="Green Fodder" value="Green Fodder" />
              <Picker.Item label="Protein Mix" value="Protein Mix" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>
      </ScrollView>

      {/* Search */}
      <SearchBar
        placeholder="Search records..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={renderRecordItem}
        ListEmptyComponent={<EmptyState message="No food records found" />}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default FoodReportsScreen;