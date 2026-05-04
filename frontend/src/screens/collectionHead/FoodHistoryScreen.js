import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFoodRecordsByCenter } from '../../redux/slices/foodSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import FoodRecordCard from '../../components/FoodRecordCard';

const FoodHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const records = useSelector((state) => state.food.records);
  const status = useSelector((state) => state.food.status);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFoodRecordsByCenter({ centerId: user.assignedCenter, token, params: {} }));
    }
  }, [dispatch, token, user]);

  const filteredRecords = records.filter((record) =>
    record.farmerId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.foodType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading') {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Center Food History</Text>
      <SearchBar placeholder="Search by farmer or food" value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <FoodRecordCard record={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No food records found for your center.</Text>}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  listContainer: {
    paddingBottom: 20
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#64748b'
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center'
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  }
};

export default FoodHistoryScreen;