import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { House, Store, Users, Salad, Phone, MapPin } from 'lucide-react-native';
import { fetchFarmersByCenter } from '../../redux/slices/farmerSlice';
import LoadingIndicator from '../../components/LoadingIndicator';
import SearchBar from '../../components/SearchBar';
import { colors, radius, spacing, shadows } from '../../theme';

const CollectionHeadFarmerListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
    [farmer.fullName, farmer.mobileNumber, farmer.farmerCode, farmer.village].some((field) => field?.toLowerCase().includes(search.toLowerCase()))
  );

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (index) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    return colors[index % colors.length];
  };

  if (status === 'loading') return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'C'}</Text>
          </View>
          <Text style={styles.brandText}>Sarvasvaa Milk</Text>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Assigned Farmers</Text>
        <Text style={styles.subtitle}>View all farmers assigned to your center</Text>

        {/* Search Bar */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, code, or mobile..." />

        {/* Farmers Count */}
        <View style={styles.countCard}>
          <Text style={styles.countLabel}>Total Farmers</Text>
          <Text style={styles.countValue}>{filtered.length}</Text>
        </View>

        {/* Farmers List */}
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No farmers found matching your search.</Text>
        ) : (
          filtered.map((farmer, index) => (
            <View key={farmer._id} style={styles.farmerCard}>
              {/* Farmer Header */}
              <View style={styles.farmerHeader}>
                <View style={styles.farmerHeaderLeft}>
                  <View style={[styles.farmerAvatar, { backgroundColor: getAvatarColor(index) }]}>
                    <Text style={styles.farmerAvatarText}>{getInitials(farmer.fullName)}</Text>
                  </View>
                  <View style={styles.farmerHeaderInfo}>
                    <Text style={styles.farmerName}>{farmer.fullName}</Text>
                    <Text style={styles.farmerCode}>{farmer.farmerCode}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, farmer.status === 'Active' ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                  <View style={[styles.statusDot, { backgroundColor: farmer.status === 'Active' ? colors.success : colors.textMuted }]} />
                  <Text style={[styles.statusText, { color: farmer.status === 'Active' ? colors.success : colors.textMuted }]}>
                    {farmer.status}
                  </Text>
                </View>
              </View>

              {/* Farmer Details */}
              <View style={styles.farmerDetail}>
                <Phone size={14} color={colors.textMuted} strokeWidth={2} />
                <Text style={styles.detailText}>{farmer.mobileNumber}</Text>
              </View>

              <View style={styles.farmerDetail}>
                <MapPin size={14} color={colors.textMuted} strokeWidth={2} />
                <Text style={styles.detailText}>{farmer.village}</Text>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>
                    {farmer.animalType === 'Buffalo' ? '🐃' : farmer.animalType === 'Cow' ? '🐄' : '🐄/🐃'}
                  </Text>
                  <Text style={styles.tagText}>{farmer.animalType}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagIcon}>🏦</Text>
                  <Text style={styles.tagText}>{farmer.bankName}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FoodEntry')}>
          <View style={styles.navIconContainer}>
            <Salad size={22} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={styles.navLabel}>Food Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Users size={22} color={colors.surface} strokeWidth={2} />
          </View>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Farmers</Text>
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
  scrollView: {
    flex: 1
  },
  content: {
    padding: spacing.lg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
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
  countCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.card
  },
  countLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4
  },
  countValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary
  },
  farmerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card
  },
  farmerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  farmerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  farmerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface
  },
  farmerHeaderInfo: {
    flex: 1
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2
  },
  farmerCode: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight
  },
  statusBadgeInactive: {
    backgroundColor: colors.lightGray
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  farmerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs
  },
  detailText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6
  },
  tagIcon: {
    fontSize: 12,
    marginRight: 4
  },
  tagText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 24,
    textAlign: 'center'
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

export default CollectionHeadFarmerListScreen;
