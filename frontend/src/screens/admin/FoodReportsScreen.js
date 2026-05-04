import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import { fetchFoodRecords, fetchMonthlyReports, deleteFoodRecord } from '../../redux/slices/foodSlice';
import { fetchCenters } from '../../redux/slices/centerSlice';
import { fetchFarmers } from '../../redux/slices/farmerSlice';
import { LoadingIndicator, EmptyState, SearchBar } from '../../components';
import styles from './adminStyles';

const FoodReportsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const foodRecords = useSelector((state) => state.food.records);
  const reports = useSelector((state) => state.food.reports);
  const status = useSelector((state) => state.food.status);
  const centers = useSelector((state) => state.centers.list);
  const farmers = useSelector((state) => state.farmers.list);

  const [filters, setFilters] = useState({
    center: '',
    farmer: '',
    date: null,
    animalType: '',
    foodType: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('records'); // 'records' or 'reports'

  useEffect(() => {
    if (token) {
      dispatch(fetchCenters(token));
      dispatch(fetchFarmers({ token }));
      loadData();
    }
  }, [dispatch, token, filters, viewMode]);

  const loadData = () => {
    if (viewMode === 'records') {
      const params = {};
      if (filters.center) params.center = filters.center;
      if (filters.farmer) params.farmer = filters.farmer;
      if (filters.date) params.date = filters.date.toISOString().split('T')[0];
      if (filters.animalType) params.animalType = filters.animalType;
      if (filters.foodType) params.foodType = filters.foodType;
      dispatch(fetchFoodRecords({ token, params }));
    } else {
      // Monthly reports - for current month
      const now = new Date();
      const params = { month: now.getMonth() + 1, year: now.getFullYear() };
      dispatch(fetchMonthlyReports({ token, params }));
    }
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

  const filteredRecords = foodRecords.filter(record =>
    record.farmerId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.collectionCenterId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <Text style={styles.centerName}>{item.centerName}</Text>
      <Text>Total Amount: ₹{item.totalAmount}</Text>
      <Text>Total Quantity: {item.totalQuantity}</Text>
      <Text>Records: {item.recordCount}</Text>
    </View>
  );

  if (status === 'loading') {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'records' && styles.activeToggle]}
          onPress={() => setViewMode('records')}
        >
          <Text style={styles.toggleText}>Records</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'reports' && styles.activeToggle]}
          onPress={() => setViewMode('reports')}
        >
          <Text style={styles.toggleText}>Monthly Reports</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'records' && (
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
      )}

      {viewMode === 'records' && (
        <>
          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Center</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.center}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, center: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="All Centers" value="" />
                  {centers.map(center => (
                    <Picker.Item key={center._id} label={center.name} value={center._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Farmer</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.farmer}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, farmer: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="All Farmers" value="" />
                  {farmers.map(farmer => (
                    <Picker.Item key={farmer._id} label={farmer.fullName} value={farmer._id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {filters.date ? filters.date.toDateString() : 'Select Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={filters.date || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    setFilters(prev => ({ ...prev, date: date }));
                  }}
                />
              )}
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Animal Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.animalType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, animalType: value }))}
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
                  onValueChange={(value) => setFilters(prev => ({ ...prev, foodType: value }))}
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
        </>
      )}

      {viewMode === 'reports' && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReportItem}
          ListEmptyComponent={<EmptyState message="No reports available" />}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default FoodReportsScreen;