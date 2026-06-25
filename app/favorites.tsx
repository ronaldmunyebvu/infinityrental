import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useFavorites } from '@/app/context/FavoritesContext';
import { colors, radius, shadow } from '@/app/lib/theme';
import { Property } from '@/app/lib/types';
import PropertyCard from '@/app/components/PropertyCard';
import BottomNav from '@/app/components/BottomNav';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { ids, refresh } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavourites = useCallback(async () => {
    if (!user) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      // Refresh the favorites context first
      await refresh();

      if (ids.size === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', Array.from(ids));

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error loading favourites:', err);
    } finally {
      setLoading(false);
    }
  }, [user, ids]);

  useFocusEffect(
    useCallback(() => {
      loadFavourites();
    }, [loadFavourites])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavourites();
    setRefreshing(false);
  }, [loadFavourites]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>Sign in to see your favourites</Text>
          <Text style={styles.emptySubtitle}>Save properties you love by tapping the heart icon.</Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/auth')} activeOpacity={0.8}>
            <Text style={styles.authBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : properties.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptySubtitle}>Tap the heart icon on any property to save it here.</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.replace('/')} activeOpacity={0.8}>
              <Ionicons name="compass-outline" size={18} color={colors.primary} />
              <Text style={styles.exploreBtnText}>Explore Properties</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{properties.length} saved {properties.length === 1 ? 'property' : 'properties'}</Text>
            {properties.map((property) => (
              <PropertyCard key={property.id} item={property} />
            ))}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="heart" size={14} color={colors.coral} />
          <Text style={styles.headerBadgeText}>{properties.length}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.charcoal },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.seafoam, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  headerBadgeText: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  countText: { fontSize: 13, color: colors.gray, marginBottom: 12, fontWeight: '500' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 20 },
  authBtn: { marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.sm },
  authBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  exploreBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.seafoam, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.sm },
  exploreBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
