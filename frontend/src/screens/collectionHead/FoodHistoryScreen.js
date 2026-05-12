import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { House, Store, Users, Salad, LogOut } from 'lucide-react-native';
import { fetchFoodRecordsByCenter } from '../../redux/slices/foodSlice';
import { logout } from '../../redux/slices/authSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import FoodRecordCard from '../../components/FoodRecordCard';
import { colors, radius, spacing, shadows } from '../../theme';

const FoodHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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

  const handleLogout = () => {
    dispatch(logout());
  };

  if (status === 'loading') {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
            </View>
            <Text style={styles.brandText}>Sarvasvaa Milk</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color={colors.danger} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Food History</Text>
        <Text style={styles.subtitle}>View all food records for your center</Text>

        <SearchBar placeholder="Search by farmer or food type" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <FoodRecordCard record={item} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No food records found for your center</Text>
          </View>
        }
        contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
      />

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadHome')}>
          <View style={styles.navIconContainer}>
            <House size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MilkEntry')}>
          <View style={styles.navIconContainer}>
            <Store size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Milk Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Salad size={22} color={colors.surface} strokeWidth={2} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Food Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollectionHeadFarmers')}>
          <View style={styles.navIconContainer}>
            <Users size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Farmers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  headerContainer: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.sm
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    alignItems: 'center',
    ...shadows.card
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: spacing.xs
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  navIconActive: {
    backgroundColor: colors.primary
  },
  navLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  navLabelActive: {
    color: colors.primary
  }
});

export default FoodHistoryScreen;