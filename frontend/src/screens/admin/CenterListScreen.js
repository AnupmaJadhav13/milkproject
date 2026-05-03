import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCenters, deleteCenter } from '../../redux/slices/centerSlice';
import CenterCard from '../../components/CenterCard';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import ConfirmDialog from '../../components/ConfirmDialog';

const CenterListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { list, status, error } = useSelector((state) => state.centers);
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchCenters(token));
  }, [dispatch, token]);

  const filteredCenters = list.filter((center) => center.name.toLowerCase().includes(search.toLowerCase()) || center.centerCode.toLowerCase().includes(search.toLowerCase()));

  const onDelete = (center) => {
    setSelectedCenter(center);
    setConfirmVisible(true);
  };

  const confirmDelete = () => {
    dispatch(deleteCenter({ id: selectedCenter._id, token }));
    setConfirmVisible(false);
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Collection Centers</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCenter')}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by center or code" />
      {filteredCenters.length === 0 ? (
        <Text style={styles.emptyText}>No centers found. Use Add to create one.</Text>
      ) : (
        <FlatList
          data={filteredCenters}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CenterCard
              center={item}
              onEdit={() => navigation.navigate('EditCenter', { center: item })}
              onDelete={() => onDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Collection Center"
        message="Are you sure you want to delete this center?"
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
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  addButton: {
    backgroundColor: '#2563eb',
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
  emptyText: {
    marginTop: 24,
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center'
  }
});

export default CenterListScreen;
