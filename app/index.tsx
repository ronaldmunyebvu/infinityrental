import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { Image, ImageBackground } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { colors, radius, shadow } from '@/app/lib/theme';
import { Property, HERO_IMAGE, PROPERTY_TYPES, DENSITY_TYPES } from '@/app/lib/types';
import PropertyCard from '@/app/components/PropertyCard';
import FilterChips from '@/app/components/FilterChips';
import BottomNav from '@/app/components/BottomNav';
import AdCarousel from '@/app/components/AdCarousel';
import { SkeletonGrid } from '@/app/components/SkeletonCard';
import { pricePeriodShort } from '@/app/lib/utils';

const HERO = 'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287526231_fe633117.png';

const PHRASES = [
  'Find your next home',
  'Discover premium stays',
  'Rentals made easy',
];

function TypewriterHeadline() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const full = PHRASES[index];
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (i <= full.length) {
        setText(full.slice(0, i));
        i++;
        timeout = setTimeout(type, 50);
      } else {
        timeout = setTimeout(() => {
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setIndex((prev) => (prev + 1) % PHRASES.length);
            setText('');
            fadeAnim.setValue(1);
          });
        }, 2500);
      }
    };
    type();
    return () => clearTimeout(timeout);
  }, [index, fadeAnim]);

  return (
    <Animated.Text style={[styles.heroTitle, { opacity: fadeAnim }]}>
      {text}<Text style={{ color: '#7CC4FF' }}>|</Text>
    </Animated.Text>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscriberIdentifier } = useSubscriber();
  const isLoggedIn = !!user || !!subscriberIdentifier;
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
          <TouchableOpacity
            onPress={() => router.replace('/')}
            activeOpacity={0.85}
            style={styles.logoWrap}
          >
            <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.moreBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/more')}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.primary} />
              <Text style={styles.moreTxt}>More</Text>
            </TouchableOpacity>
            {isLoggedIn ? (
              <TouchableOpacity
                style={styles.portalBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/landlord')}
              >
                <Ionicons name="person" size={18} color="#fff" />
                <Text style={styles.portalTxt}>Portal</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.signInBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/auth')}
              >
                <Ionicons name="log-in-outline" size={16} color="#fff" />
                <Text style={styles.signInTxt}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
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
            <Ionicons name="options-outline" size={16} color={showAdv ? '#fff' : colors.primary} />
            <Text style={[styles.filterTxt, showAdv && { color: '#fff' }]}>Filters</Text>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
              <TypewriterHeadline />
              <Text style={styles.heroSub}>Browse listings, unlock contacts, connect instantly</Text>
              <View style={styles.heroFeatureRow}>
                {['Smart Search', '$5 Pass', 'Secure Pay'].map((f) => (
                  <View key={f} style={styles.heroFeature}>
                    <Ionicons name="checkmark-circle" size={12} color="#7CC4FF" />
                    <Text style={styles.heroFeatureTxt}>{f}</Text>
                  </View>
                ))}
              </View>
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
                    <View style={styles.fprice}><Text style={styles.fpriceTxt}>${p.price}{pricePeriodShort(p.price_period)}</Text></View>
                    {p.rating != null && (
                      <View style={styles.frating}>
                        <Ionicons name="star" size={10} color="#fff" />
                        <Text style={styles.fratingTxt}>{Number(p.rating).toFixed(1)}</Text>
                      </View>
                    )}
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
            <SkeletonGrid count={4} />
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

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <View style={styles.footerLogo}><Ionicons name="home" size={20} color="#fff" /></View>
            <Text style={styles.footBrand}><Text style={{ color: '#fff' }}>RENT</Text><Text style={{ color: colors.primary }}>ZIMBABWE</Text></Text>
          </View>
          <Text style={styles.footTxt}>Premium accommodation, simplified. Get the premium pass to unlock all owner contacts instantly.</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/about')}><Text style={styles.footerLink}>About</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/contact')}><Text style={styles.footerLink}>Contact</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy')}><Text style={styles.footerLink}>Privacy</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/terms')}><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
          </View>
          <Text style={styles.footerCopy}>© {new Date().getFullYear()} RENTZIMBABWE. Payments secured via EcoCash.</Text>
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  logo: { height: 44, width: 66 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.seafoam, ...shadow },
  moreTxt: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  portalBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.primary, ...shadow },
  portalTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  signInBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.primary, ...shadow },
  signInTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 20, marginTop: 18, paddingHorizontal: 16, borderRadius: radius.md, gap: 10, height: 52, ...shadow },
  searchInput: { flex: 1, fontSize: 15, color: colors.charcoal },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 38, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.seafoam },
  filterTxt: { fontSize: 13, fontWeight: '700', color: colors.primary },
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
  hero: { height: 200, borderRadius: radius.lg },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(10,94,124,0.6)', borderRadius: radius.lg, padding: 20, justifyContent: 'center' },
  heroBadge: { color: '#cdeaf3', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4, width: '90%' },
  heroSub: { color: '#e0f0f5', fontSize: 13, marginTop: 4 },
  heroFeatureRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  heroFeature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroFeatureTxt: { color: '#cdeaf3', fontSize: 11, fontWeight: '600' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 14, gap: 6 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.charcoal },
  count: { fontSize: 13, color: colors.gray, fontWeight: '600' },
  fcard: { width: 200 },
  fimg: { height: 130, justifyContent: 'space-between' },
  fprice: { alignSelf: 'flex-start', margin: 10, backgroundColor: colors.coral, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  fpriceTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  frating: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.pill, gap: 2 },
  fratingTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  ftitle: { fontSize: 14.5, fontWeight: '700', color: colors.charcoal, marginTop: 8 },
  floc: { fontSize: 12, color: colors.gray, marginTop: 2 },
  list: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyTxt: { color: colors.gray, fontSize: 15 },
  footer: { backgroundColor: colors.primaryDark, margin: 20, marginTop: 10, borderRadius: radius.lg, padding: 24 },
  footerBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerLogo: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  footBrand: { color: '#fff', fontSize: 20, fontWeight: '800' },
  footTxt: { color: '#cdeaf3', fontSize: 13, lineHeight: 20, marginTop: 8 },
  footerLinks: { flexDirection: 'row', gap: 16, marginTop: 14 },
  footerLink: { color: '#7CC4FF', fontSize: 13, fontWeight: '600' },
  footerCopy: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 12 },
});
