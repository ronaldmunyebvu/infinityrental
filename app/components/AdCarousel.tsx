import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/lib/supabase';
import { colors, radius } from '@/app/lib/theme';
import { Ad } from '@/app/lib/types';

const W = Dimensions.get('window').width;

const COLOR_MAP: Record<string, string> = {
  'amber-400': '#FBBF24',
  'amber-500': '#F59E0B',
  'orange-400': '#FB923C',
  'orange-500': '#F97316',
  'blue-400': '#60A5FA',
  'blue-500': '#3B82F6',
  'blue-600': '#2563EB',
  'sky-400': '#38BDF8',
  'sky-500': '#0EA5E9',
  'cyan-500': '#06B6D4',
  'teal-400': '#2DD4BF',
  'teal-500': '#14B8A6',
  'emerald-400': '#34D399',
  'emerald-500': '#10B981',
  'green-400': '#4ADE80',
  'green-500': '#22C55E',
  'red-400': '#F87171',
  'red-500': '#EF4444',
  'rose-400': '#FB7185',
  'rose-500': '#F43F5E',
  'pink-500': '#EC4899',
  'purple-400': '#C084FC',
  'purple-500': '#A855F7',
  'violet-500': '#8B5CF6',
  'indigo-500': '#6366F1',
  'slate-500': '#64748B',
  'slate-600': '#475569',
  'gray-700': '#374151',
  'gray-800': '#1F2937',
};

function resolveColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (value.startsWith('#')) return value;
  if (/^[a-zA-Z0-9-]+$/.test(value)) return COLOR_MAP[value] || fallback;
  return value;
}

export default function AdCarousel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setCurrent((prev) => (prev + 1) % ads.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const loadAds = async () => {
    try {
      const { data } = await supabase.from('ads').select('*').eq('is_active', true);
      if (data && data.length > 0) setAds(data as Ad[]);
    } catch (e) {
      // Silently fail - ads are optional
    }
  };

  if (ads.length === 0) {
    // Default CTA when no ads
    return (
      <View style={styles.wrap}>
        <View style={styles.defaultCard}>
          <Ionicons name="megaphone-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.defaultTitle}>List Your Property</Text>
            <Text style={styles.defaultSub}>Reach thousands of tenants across Zimbabwe</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </View>
      </View>
    );
  }

  const ad = ads[current];

  const onCta = () => {
    if (ad.cta_url) Linking.openURL(ad.cta_url);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, backgroundColor: resolveColor(ad.gradient_from, colors.primary) }]}>
        <View style={styles.overlay} />
        <Text style={styles.adTitle}>{ad.title}</Text>
        <Text style={styles.adDesc}>{ad.description}</Text>
        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: resolveColor(ad.gradient_to, colors.coral) }]} activeOpacity={0.85} onPress={onCta}>
          <Text style={styles.ctaTxt}>{ad.cta_text || 'Learn More'}</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
        {ads.length > 1 && (
          <View style={styles.dots}>
            {ads.map((_, i) => (
              <View key={i} style={[styles.dot, i === current && styles.dotOn]} />
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginTop: 14 },
  card: { borderRadius: radius.lg, padding: 20, minHeight: 150, justifyContent: 'center', overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  adTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  adDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 18 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, marginTop: 14 },
  ctaTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 5, marginTop: 12, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { width: 18, backgroundColor: '#fff' },
  defaultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, ...({ shadowColor: '#0A2540', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }) },
  defaultTitle: { fontSize: 15, fontWeight: '700', color: colors.charcoal },
  defaultSub: { fontSize: 12, color: colors.gray, marginTop: 2 },
});
