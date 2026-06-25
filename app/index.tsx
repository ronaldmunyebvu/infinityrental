import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Keyboard } from 'react-native';
import { ImageBackground } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { colors, radius, shadow } from '@/app/lib/theme';
import { Property, HERO_IMAGE, PROPERTY_TYPES, DENSITY_TYPES } from '@/app/lib/types';
import PropertyCard from '@/app/components/PropertyCard';
import FilterChips from '@/app/components/FilterChips';
import BottomNav from '@/app/components/BottomNav';
import AdCarousel from '@/app/components/AdCarousel';

const HERO = 'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287526231_fe633117.png';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [showAdv, setShowAdv] = useState(false);
  const [density, setDensity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    setProps((data as Property[]) || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = props.filter((p) => {
    const matchType = type === 'all' || p.property_type === type;
    const matchDensity = !density || (p as any).density === density;
    const price = p.price || 0;
    const matchMin = !minPrice || price >= Number(minPrice);
    const matchMax = !maxPrice || price <= Number(maxPrice);
    const q = query.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    return matchType && matchDensity && matchMin && matchMax && matchQ;
  });

  const featured = props.filter((p) => (p as any).featured).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Find your</Text>
            <Text style={styles.headline}>Perfect Home</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.8}
            onPress={() => router.push(user ? '/landlord' : '/auth')}
          >
            <Ionicons name={user ? 'person' : 'log-in-outline'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.gray} />
          <TextInput
            placeholder="Search location or property..."
            placeholderTextColor={colors.lightGray}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.lightGray} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.filterBtn, showAdv && styles.filterBtnActive]}
            onPress={() => setShowAdv(!showAdv)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color={showAdv ? '#fff' : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Advanced filters panel */}
        {showAdv && (
          <View style={styles.advPanel}>
            <Text style={styles.advLabel}>Price range ($/mo)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                placeholderTextColor={colors.lightGray}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <Text style={styles.dash}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                placeholderTextColor={colors.lightGray}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
            <Text style={[styles.advLabel, { marginTop: 12 }]}>Area density</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.densityChip, !density && styles.densityChipActive]}
                onPress={() => setDensity('')}
                activeOpacity={0.8}
              >
                <Text style={[styles.densityTxt, !density && { color: '#fff' }]}>Any</Text>
              </TouchableOpacity>
              {DENSITY_TYPES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.densityChip, density === d && styles.densityChipActive]}
                  onPress={() => setDensity(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.densityTxt, density === d && { color: '#fff' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.advResultRow}>
              <Text style={styles.advResultTxt}>
                <Text style={{ fontWeight: '800', color: colors.primary }}>{filtered.length}</Text> stays match your search
              </Text>
            </View>
          </View>
        )}

        {/* Hero banner */}
        <View style={styles.heroWrap}>
          <ImageBackground source={{ uri: HERO }} style={styles.hero} imageStyle={{ borderRadius: radius.lg }}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroBadge}>PREMIUM RENTALS</Text>
              <Text style={styles.heroTitle}>List or Rent in Minutes</Text>
              <TouchableOpacity
                style={styles.heroBtn}
                activeOpacity={0.85}
                onPress={() => router.push(user ? '/landlord' : '/auth')}
              >
                <Text style={styles.heroBtnTxt}>Become a Landlord</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Ad Carousel */}
        <AdCarousel />

        <FilterChips active={type} onChange={setType} />

        {/* Featured row */}
        {type === 'all' && query === '' && featured.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <Ionicons name="flame" size={16} color={colors.coral} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {featured.map((p) => (
                <TouchableOpacity key={p.id} activeOpacity={0.9} style={styles.fcard} onPress={() => router.push(`/property/${p.id}`)}>
                  <ImageBackground source={{ uri: p.images?.[0] }} style={styles.fimg} imageStyle={{ borderRadius: radius.md }}>
                    <View style={styles.fprice}><Text style={styles.fpriceTxt}>${p.price}/mo</Text></View>
                  </ImageBackground>
                  <Text style={styles.ftitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.floc} numberOfLines={1}>{p.location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Listing grid */}
        {!showAdv && (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{query || type !== 'all' ? 'Results' : 'All Properties'}</Text>
            <Text style={styles.count}>{filtered.length} found</Text>
          </View>
        )}

        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={48} color={colors.lightGray} />
              <Text style={styles.emptyTxt}>No properties found</Text>
            </View>
          ) : (
            filtered.map((p) => (
              <PropertyCard key={p.id} item={p} />
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footBrand}><Text style={{ color: '#fff' }}>RENT</Text><Text style={{ color: colors.primary }}>ZIMBABWE</Text></Text>
          <Text style={styles.footTxt}>Premium accommodation, simplified. Get the premium pass to unlock all owner contacts instantly.</Text>
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  hello: { fontSize: 15, color: colors.gray, fontWeight: '500' },
  headline: { fontSize: 28, fontWeight: '800', color: colors.charcoal, marginTop: -2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 20, marginTop: 18, paddingHorizontal: 16, borderRadius: radius.md, gap: 10, height: 52, ...shadow },
  searchInput: { flex: 1, fontSize: 15, color: colors.charcoal },
  filterBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.seafoam, justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: colors.primary },
  advPanel: { backgroundColor: colors.white, marginHorizontal: 20, marginTop: 8, borderRadius: radius.md, padding: 16, ...shadow },
  advLabel: { fontSize: 13, fontWeight: '600', color: colors.charcoal, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14, color: colors.charcoal, backgroundColor: colors.bg },
  dash: { fontSize: 16, color: colors.lightGray, fontWeight: '600' },
  densityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  densityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  densityTxt: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  advResultRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  advResultTxt: { fontSize: 13, color: colors.gray },
  heroWrap: { paddingHorizontal: 20, marginTop: 18 },
  hero: { height: 160, borderRadius: radius.lg },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(10,94,124,0.55)', borderRadius: radius.lg, padding: 20, justifyContent: 'center' },
  heroBadge: { color: '#cdeaf3', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 14, width: '70%' },
  heroBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, gap: 6 },
  heroBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: 13.5 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 14, gap: 6 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.charcoal },
  count: { fontSize: 13, color: colors.gray, fontWeight: '600' },
  fcard: { width: 200 },
  fimg: { height: 130, justifyContent: 'flex-end' },
  fprice: { alignSelf: 'flex-start', margin: 10, backgroundColor: colors.coral, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  fpriceTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  ftitle: { fontSize: 14.5, fontWeight: '700', color: colors.charcoal, marginTop: 8 },
  floc: { fontSize: 12, color: colors.gray, marginTop: 2 },
  list: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyTxt: { color: colors.gray, fontSize: 15 },
  footer: { backgroundColor: colors.primaryDark, margin: 20, marginTop: 10, borderRadius: radius.lg, padding: 24 },
  footBrand: { color: '#fff', fontSize: 20, fontWeight: '800' },
  footTxt: { color: '#cdeaf3', fontSize: 13, lineHeight: 20, marginTop: 8 },
});
