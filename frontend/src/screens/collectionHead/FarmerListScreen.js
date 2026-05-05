import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import FarmerCard from '../../components/FarmerCard';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';

const CollectionHeadFarmerListScreen = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const { list, status } = useSelector((state) => state.farmers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (token && user?.assignedCenter) {
      dispatch(fetchFarmersByCenter({ centerId: user.assignedCenter, token }));
    }
  }, [dispatch, token, user]);

  const filtered = list.filter((farmer) =>
    [farmer.fullName, farmer.mobileNumber, farmer.village].some((field) => field?.toLowerCase().includes(search.toLowerCase()))
  );

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assigned Farmers</Text>
      <SearchBar value={search} onChange={setSearch} placeholder="Search farmers" />
      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No active farmers found for your center.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FarmerCard farmer={item} onPress={() => null} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  list: {
    paddingBottom: 20
  },
  emptyText: {
    color: '#64748b',
    marginTop: 24,
    textAlign: 'center'
  }
});

export default CollectionHeadFarmerListScreen;
