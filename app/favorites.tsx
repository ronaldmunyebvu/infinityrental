import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useFavorites } from '@/app/context/FavoritesContext';
import { colors, radius } from '@/app/lib/theme';
import { Property } from '@/app/lib/data';
import PropertyCard from '@/app/components/PropertyCard';
import BottomNav from '@/app/components/BottomNav';

export default function Favorites() {
  const router = useRouter();
  const { user } = useAuth();
  const { ids, refresh, count } = useFavorites();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await refresh();
    const idArr = Array.from(ids);
    if (idArr.length === 0) { setItems([]); setLoading(false); setRefreshing(false); return; }
    const { data } = await supabase.from('properties').select('*').in('id', idArr);
    setItems((data as Property[]) || []);
    setLoading(false);
    setRefreshing(false);
  }, [ids, refresh]);

  useFocusEffect(useCallback(() => { if (user) load(); else setLoading(false); }, [user, load]));

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.head}><Text style={styles.title}>Saved</Text></View>
        <View style={styles.guard}>
          <Ionicons name="heart-outline" size={56} color={colors.lightGray} />
          <Text style={styles.guardTxt}>Sign in to save your favorite properties</Text>
          <TouchableOpacity style={styles.guardBtn} onPress={() => router.push('/auth')} activeOpacity={0.85}>
            <Text style={styles.guardBtnTxt}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <BottomNav active="favorites" />
      </SafeAreaView>
    );
  }

  // keep displayed list in sync if user un-hearts on this screen
  const visible = items.filter((p) => ids.has(p.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title}>Saved Properties</Text>
        <Text style={styles.sub}>{count} {count === 1 ? 'listing' : 'listings'} saved</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={40} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>No saved properties yet</Text>
            <Text style={styles.emptyTxt}>Tap the heart icon on any listing to save it here for later.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
              <Ionicons name="compass-outline" size={17} color="#fff" />
              <Text style={styles.browseTxt}>Explore Listings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          visible.map((p) => <PropertyCard key={p.id} item={p} />)
        )}
      </ScrollView>

      <BottomNav active="favorites" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.charcoal },
  sub: { fontSize: 14, color: colors.gray, marginTop: 2 },
  guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 30 },
  guardTxt: { fontSize: 15, color: colors.gray, textAlign: 'center' },
  guardBtn: { backgroundColor: colors.primary, paddingHorizontal: 34, paddingVertical: 14, borderRadius: radius.pill },
  guardBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.seafoam, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal },
  emptyTxt: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 21, paddingHorizontal: 30 },
  browseBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.coral, paddingHorizontal: 22, paddingVertical: 13, borderRadius: radius.pill, marginTop: 10 },
  browseTxt: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
});
