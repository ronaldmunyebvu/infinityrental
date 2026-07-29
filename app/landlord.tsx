import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { colors, radius, cardShadow, shadow } from '@/app/lib/theme';
import { Property, PROPERTY_TYPES } from '@/app/lib/types';

export default function LandlordScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { subscriberIdentifier, logoutSubscriber } = useSubscriber();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchProperties = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setProperties(data);
    }
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [fetchProperties])
  );

  const handleLogout = async () => {
    await signOut();
    await logoutSubscriber();
    router.replace('/');
  };

  const handleDelete = (prop: Property) => {
    Alert.alert('Delete Listing', `Delete "${prop.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('properties').delete().eq('id', prop.id);
          if (!error) {
            setProperties((prev) => prev.filter((p) => p.id !== prop.id));
          }
        },
      },
    ]);
  };

  const totalListings = properties.length;
  const totalValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
  const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = properties.reduce((sum, p) => sum + (p.likes || 0), 0);

  const filtered = properties
    .filter((p) => typeFilter === 'All' || p.property_type === typeFilter)
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.location || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const stats = [
    { label: 'Total Listings', value: totalListings, icon: 'home-outline' as const, color: colors.primary },
    { label: 'Total Value', value: `$${totalValue.toLocaleString()}`, icon: 'wallet-outline' as const, color: colors.seafoam },
    { label: 'Total Views', value: totalViews, icon: 'eye-outline' as const, color: colors.coral },
    { label: 'Total Likes', value: totalLikes, icon: 'heart-outline' as const, color: '#E8505B' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Landlord Portal</Text>
          <Text style={styles.subGreeting}>{subscriberIdentifier || user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.coral} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.statCard, cardShadow]}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '15' }]}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/add-property')}
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {/* Search + Sort */}
          <View style={styles.searchSortRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search properties..."
                placeholderTextColor={colors.lightGray}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <View style={styles.sortBox}>
              <TouchableOpacity style={styles.sortBtn} onPress={() => {
                const order: typeof sortBy[] = ['newest', 'price_asc', 'price_desc'];
                const idx = order.indexOf(sortBy);
                setSortBy(order[(idx + 1) % order.length]);
              }}>
                <Ionicons name="swap-vertical" size={14} color={colors.primary} />
                <Text style={styles.sortLabel}>
                  {sortBy === 'newest' ? 'Newest' : sortBy === 'price_asc' ? 'Price ↑' : 'Price ↓'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Type filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChips}>
            {['All', ...PROPERTY_TYPES].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, typeFilter === t && styles.typeChipActive]}
                onPress={() => setTypeFilter(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, typeFilter === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Listings */}
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={48} color={colors.lightGray} />
              <Text style={styles.emptyText}>{properties.length === 0 ? 'No listings yet' : 'No properties match your filters'}</Text>
              {properties.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/add-property')}
                >
                  <Text style={styles.emptyBtnText}>Add Your First Property</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => { setTypeFilter('All'); setSearch(''); }}
                >
                  <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map((prop) => (
              <View key={prop.id} style={[styles.listingCard, cardShadow]}>
                <Image
                  source={{
                    uri: prop.images?.[0] || 'https://via.placeholder.com/150',
                  }}
                  style={styles.listingImage}
                />
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>
                    {prop.title}
                  </Text>
                  <View style={styles.listingLocation}>
                    <Ionicons name="location" size={12} color={colors.gray} />
                    <Text style={styles.listingLocationText} numberOfLines={1}>
                      {prop.location}
                    </Text>
                  </View>
                  <View style={styles.listingMeta}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{prop.property_type}</Text>
                    </View>
                    <Text style={styles.listingPrice}>
                    ${prop.price?.toLocaleString()}/mo
                    </Text>
                  </View>
                  <View style={styles.listingStats}>
                    <View style={styles.miniStat}>
                      <Ionicons name="eye-outline" size={13} color={colors.gray} />
                      <Text style={styles.miniStatText}>{prop.views ?? 0}</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <Ionicons name="heart-outline" size={13} color={colors.gray} />
                      <Text style={styles.miniStatText}>{prop.likes ?? 0}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.listingActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/property/${prop.id}`)}
                  >
                    <Ionicons name="eye" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/edit-property?id=${prop.id}`)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.seafoam} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(prop)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.coral} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: colors.white,
    ...shadow,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.charcoal },
  subGreeting: { fontSize: 13, color: colors.gray, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.coral + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.charcoal },
  statLabel: { fontSize: 12, color: colors.gray, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    gap: 4,
  },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  searchSortRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, marginBottom: 12,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, height: 40,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.charcoal },
  sortBox: { flexDirection: 'row', alignItems: 'center' },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, height: 40,
  },
  sortLabel: { fontSize: 13, fontWeight: '600', color: colors.primary },
  typeChips: { paddingHorizontal: 20, gap: 8, paddingBottom: 14 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  listingImage: { width: 110, height: 'auto', minHeight: 140, borderTopLeftRadius: radius.md, borderBottomLeftRadius: radius.md },
  listingInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  listingTitle: { fontSize: 15, fontWeight: '700', color: colors.charcoal },
  listingLocation: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  listingLocationText: { fontSize: 12, color: colors.gray, flex: 1 },
  listingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  typeBadge: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '600', color: colors.charcoal },
  listingPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
  listingStats: { flexDirection: 'row', gap: 10, marginTop: 6 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniStatText: { fontSize: 11, color: colors.gray },
  listingActions: {
    justifyContent: 'center',
    gap: 6,
    paddingRight: 10,
    paddingVertical: 12,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: colors.gray, marginTop: 12 },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
