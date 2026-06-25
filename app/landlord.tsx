import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { colors, radius, cardShadow, shadow } from '@/app/lib/theme';
import { Property } from '@/app/lib/data';

export default function Landlord() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setListings((data as Property[]) || []);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to remove this property?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('properties').delete().eq('id', id); load(); } },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guard}>
          <Ionicons name="lock-closed" size={48} color={colors.lightGray} />
          <Text style={styles.guardTxt}>Please sign in to access your portal</Text>
          <TouchableOpacity style={styles.guardBtn} onPress={() => router.push('/auth')}>
            <Text style={styles.guardBtnTxt}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalValue = listings.reduce((s, p) => s + Number(p.price), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Landlord Portal</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { signOut(); router.replace('/'); }}>
          <Ionicons name="log-out-outline" size={20} color={colors.coral} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.welcome}>
          <Text style={styles.welcomeName}>Hi, {profile?.full_name || 'Landlord'}</Text>
          <Text style={styles.welcomeSub}>Manage your property portfolio</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{listings.length}</Text>
            <Text style={styles.statLbl}>Listings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Text style={[styles.statNum, { color: '#fff' }]}>${totalValue}</Text>
            <Text style={[styles.statLbl, { color: '#cdeaf3' }]}>Total /mo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{listings.filter((l) => l.featured).length}</Text>
            <Text style={styles.statLbl}>Featured</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.88} onPress={() => router.push('/add-property')}>
          <Ionicons name="add-circle" size={22} color="#fff" />
          <Text style={styles.addTxt}>Add New Property</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Listings</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : listings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="home-outline" size={44} color={colors.lightGray} />
            <Text style={styles.emptyTxt}>No listings yet. Add your first property!</Text>
          </View>
        ) : (
          listings.map((p) => (
            <View key={p.id} style={styles.listing}>
              <Image source={{ uri: p.images?.[0] }} style={styles.listImg} />
              <View style={styles.listBody}>
                <Text style={styles.listTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.listLoc} numberOfLines={1}>{p.location}</Text>
                <Text style={styles.listPrice}>${p.price}/mo</Text>
              </View>
              <View style={styles.listActions}>
                <TouchableOpacity onPress={() => router.push(`/property/${p.id}`)} style={styles.actBtn}>
                  <Ionicons name="eye-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(p.id)} style={styles.actBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.coral} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  hTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal },
  welcome: { paddingHorizontal: 20, marginTop: 8 },
  welcomeName: { fontSize: 24, fontWeight: '800', color: colors.charcoal },
  welcomeSub: { fontSize: 14, color: colors.gray, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 18 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: radius.md, padding: 16, alignItems: 'center', ...cardShadow },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.charcoal },
  statLbl: { fontSize: 11.5, color: colors.gray, marginTop: 4, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.coral, marginHorizontal: 20, marginTop: 18, height: 54, borderRadius: radius.md },
  addTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal, paddingHorizontal: 20, marginTop: 26, marginBottom: 14 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTxt: { color: colors.gray, fontSize: 14.5, textAlign: 'center', paddingHorizontal: 40 },
  listing: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 14, borderRadius: radius.md, padding: 10, alignItems: 'center', ...cardShadow },
  listImg: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.seafoam },
  listBody: { flex: 1, marginLeft: 12 },
  listTitle: { fontSize: 15, fontWeight: '700', color: colors.charcoal },
  listLoc: { fontSize: 12.5, color: colors.gray, marginTop: 2 },
  listPrice: { fontSize: 14, fontWeight: '800', color: colors.primary, marginTop: 4 },
  listActions: { gap: 8 },
  actBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 30 },
  guardTxt: { fontSize: 15, color: colors.gray, textAlign: 'center' },
  guardBtn: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: radius.pill },
  guardBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
