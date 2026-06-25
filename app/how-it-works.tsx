import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius } from '@/app/lib/theme';

const STEPS = [
  { num: '1', icon: 'search-outline' as const, title: 'Browse Listings', desc: 'Search through hundreds of verified properties in your area. Use our intuitive smart filters to specify price, property type, and density to find exactly what fits your lifestyle.', color: colors.primary },
  { num: '2', icon: 'card-outline' as const, title: 'Get the Premium Pass', desc: 'For a small monthly fee, instantly unlock landlord contact details for every single listing on our platform. Pay seamlessly and securely using EcoCash straight from your mobile phone.', color: '#6366F1' },
  { num: '3', icon: 'key-outline' as const, title: 'Contact Landlords Directly', desc: 'No hidden fees and no middlemen. Call or WhatsApp landlords directly to arrange viewings, ask questions, and negotiate terms entirely on your own schedule.', color: '#F59E0B' },
  { num: '4', icon: 'home-outline' as const, title: 'Move In', desc: "Once you've found the perfect spot, finalize your lease directly with the owner, pack your bags, and settle into your new home. It really is that simple!", color: '#10B981' },
];

export default function HowItWorksScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How It Works</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>How It Works</Text>
          <Text style={styles.heroDesc}>
            A simple, transparent four-step process to find your next home without the hassle.
          </Text>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepIconWrap, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon} size={36} color={step.color} />
              </View>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP {step.num}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
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
    alignItems: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  heroDesc: { color: '#94B3CC', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  steps: { paddingHorizontal: 20, gap: 24, marginTop: -20 },
  stepRow: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: 24,
    borderWidth: 1, borderColor: colors.border,
  },
  stepIconWrap: {
    width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  stepBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.seafoam, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.pill, marginBottom: 10,
  },
  stepBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  stepDesc: { fontSize: 14, color: colors.gray, lineHeight: 21 },
});
