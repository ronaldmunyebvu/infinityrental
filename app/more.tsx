import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/app/lib/theme';

const LINKS = [
  { icon: 'information-circle-outline', label: 'About Us', route: '/about' },
  { icon: 'bulb-outline', label: 'How It Works', route: '/how-it-works' },
  { icon: 'call-outline', label: 'Contact Us', route: '/contact' },
  { icon: 'shield-checkmark-outline', label: 'Privacy Policy', route: '/privacy' },
  { icon: 'document-text-outline', label: 'Terms of Service', route: '/terms' },
];

export default function MorePage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.brandCard}>
          <View style={styles.logo}><Ionicons name="home" size={32} color="#fff" /></View>
          <Text style={styles.brand}><Text style={{ color: '#fff' }}>RENT</Text><Text style={{ color: colors.primary }}>ZIMBABWE</Text></Text>
          <Text style={styles.tagline}>Premium accommodation, simplified.</Text>
          <Text style={styles.desc}>Browse listings from trusted landlords across Zimbabwe. Get the $5 premium pass to unlock all owner contacts instantly.</Text>
        </View>

        <View style={styles.linksCard}>
          {LINKS.map((l, i) => (
            <TouchableOpacity
              key={l.route}
              style={[styles.linkRow, i < LINKS.length - 1 && styles.linkBorder]}
              onPress={() => router.push(l.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.linkIcon}>
                <Ionicons name={l.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.linkLabel}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.lightGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Store Badges */}
        <View style={styles.storeSection}>
          <Text style={styles.storeTitle}>Download the App</Text>
          <View style={styles.storeRow}>
            <TouchableOpacity
              style={styles.storeBadge}
              onPress={() => Linking.openURL('https://play.google.com/store')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google-playstore" size={20} color="#fff" />
              <View>
                <Text style={styles.storeBadgeSub}>GET IT ON</Text>
                <Text style={styles.storeBadgeMain}>Google Play</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.storeBadge}
              onPress={() => Linking.openURL('https://www.apple.com/app-store/')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={22} color="#fff" />
              <View>
                <Text style={styles.storeBadgeSub}>DOWNLOAD ON</Text>
                <Text style={styles.storeBadgeMain}>App Store</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTxt}>© {new Date().getFullYear()} RENTZIMBABWE</Text>
          <Text style={styles.footerSub}>All rights reserved. Payments secured via EcoCash.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
  content: { padding: 20, paddingBottom: 40 },
  brandCard: { backgroundColor: colors.primaryDark, borderRadius: radius.lg, padding: 24, alignItems: 'center', marginBottom: 20 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 28, fontWeight: '800', marginTop: 12 },
  tagline: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 },
  desc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  linksCard: { backgroundColor: colors.white, borderRadius: radius.md, ...shadow },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  linkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.seafoam, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.charcoal },
  storeSection: { alignItems: 'center', marginTop: 24, gap: 12 },
  storeTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal },
  storeRow: { flexDirection: 'row', gap: 12 },
  storeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0a2540', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: radius.md,
  },
  storeBadgeSub: { color: 'rgba(255,255,255,0.6)', fontSize: 9, letterSpacing: 0.5 },
  storeBadgeMain: { color: '#fff', fontSize: 14, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 30, gap: 4 },
  footerTxt: { fontSize: 13, fontWeight: '600', color: colors.gray },
  footerSub: { fontSize: 12, color: colors.lightGray },
});
