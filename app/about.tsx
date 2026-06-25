import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/app/lib/theme';

const VALUES = [
  { icon: 'target-outline' as const, title: 'Our Mission', desc: 'To eliminate the stress, high agent fees, and uncertainty of finding a home by building a tech-driven marketplace that empowers everyone.' },
  { icon: 'shield-checkmark-outline' as const, title: 'Trust & Security', desc: 'We integrate secure EcoCash payments so you can search and transact with total peace of mind. Say goodbye to property scams.' },
  { icon: 'people-outline' as const, title: 'For Everyone', desc: 'Whether you are listing an empty room, a full house, or looking for your next dream apartment, we are built for you.' },
  { icon: 'heart-outline' as const, title: 'Community First', desc: 'We listen to our users. Our features, from premium passes to intuitive filters, make finding accommodation accessible to all.' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>About RENTZIMBABWE</Text>
          <Text style={styles.heroTitle}>Redefining{'\n'}Property Search</Text>
          <Text style={styles.heroDesc}>
            We're building the future of real estate in Zimbabwe — connecting seekers and owners directly, securely, and without the exorbitant fees.
          </Text>
        </View>

        <View style={styles.valuesGrid}>
          {VALUES.map((item, i) => (
            <View key={i} style={[styles.valueCard, shadow]}>
              <View style={styles.valueIcon}>
                <Ionicons name={item.icon} size={28} color={colors.primary} />
              </View>
              <Text style={styles.valueTitle}>{item.title}</Text>
              <Text style={styles.valueDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to find your home?</Text>
          <Text style={styles.ctaDesc}>Join thousands of Zimbabweans using our platform daily.</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Start Searching</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#0a2540',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { paddingBottom: 40 },
  heroSection: {
    backgroundColor: '#0a2540', paddingHorizontal: 24, paddingBottom: 48, paddingTop: 8,
  },
  heroLabel: { color: '#7CC4FF', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 12 },
  heroDesc: { color: '#94B3CC', fontSize: 15, lineHeight: 22 },
  valuesGrid: { paddingHorizontal: 20, gap: 14, marginTop: -20 },
  valueCard: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  valueIcon: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.seafoam,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  valueTitle: { fontSize: 17, fontWeight: '700', color: colors.charcoal, marginBottom: 6 },
  valueDesc: { fontSize: 14, color: colors.gray, lineHeight: 21 },
  ctaCard: {
    margin: 20, marginTop: 28, backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: 28, alignItems: 'center',
  },
  ctaTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  ctaDesc: { color: '#cdeaf3', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.md,
  },
  ctaBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});
