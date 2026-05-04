import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFarmers, deleteFarmer } from '../../redux/slices/farmerSlice';
import FarmerCard from '../../components/FarmerCard';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';

const FarmerListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.farmers);
  const token = useSelector((state) => state.auth.token);
  const selectedCenterId = route?.params?.centerId || '';
  const selectedCenterCode = route?.params?.centerCode || '';
  const selectedCenterName = route?.params?.centerName || '';
  const [search, setSearch] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  useEffect(() => {
    if (token) {
      const params = selectedCenterId ? { centerId: selectedCenterId } : {};
      dispatch(fetchFarmers({ token, params }));
    }
  }, [dispatch, token, selectedCenterId]);

  const filtered = list.filter((farmer) =>
    [farmer.fullName, farmer.mobileNumber, farmer.village].some((field) => field?.toLowerCase().includes(search.toLowerCase()))
  );

  const onDelete = (farmer) => {
    setSelectedFarmer(farmer);
    setConfirmVisible(true);
  };

  const confirmDelete = () => {
    dispatch(deleteFarmer({ id: selectedFarmer._id, token }));
    setConfirmVisible(false);
  };

  const onCall = (mobile) => {
    const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
    if (!cleaned) {
      Alert.alert('No number', 'This farmer has no mobile number.');
      return;
    }
    Linking.openURL(`tel:${cleaned}`);
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{selectedCenterName ? `${selectedCenterName} Farmers` : 'Farmers'}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFarmer', { centerId: selectedCenterId, centerCode: selectedCenterCode, centerName: selectedCenterName })}
        >
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {selectedCenterName ? <Text style={styles.subTitle}>Showing farmers for selected collection center</Text> : null}
      <SearchBar value={search} onChange={setSearch} placeholder="Search farmers" />
      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No farmers match your search or filter.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <FarmerCard
              farmer={item}
              actions={
                <>
                  <TouchableOpacity style={[styles.actionButton, styles.call]} onPress={() => onCall(item.mobileNumber)}>
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditFarmer', { farmer: item })}>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.delete]} onPress={() => onDelete(item)}>
                    <Text style={styles.actionText}>Delete</Text>
                  </TouchableOpacity>
                </>
              }
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
      <ConfirmDialog
        visible={confirmVisible}
        title="Remove Farmer"
        message="Are you sure you want to delete this farmer record?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a'
  },
  subTitle: {
    marginTop: 8,
    marginBottom: 10,
    color: '#64748b'
  },
  addButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14
  },
  addText: {
    color: '#fff',
    fontWeight: '700'
  },
  list: {
    paddingTop: 16
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 6
  },
  call: {
    backgroundColor: '#16a34a'
  },
  delete: {
    backgroundColor: '#ef4444'
  },
  actionText: {
    color: '#fff',
    fontWeight: '700'
  },
  emptyText: {
    marginTop: 24,
    color: '#64748b',
    textAlign: 'center'
  }
});

export default FarmerListScreen;
