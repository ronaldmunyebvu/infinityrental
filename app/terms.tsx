import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius } from '@/app/lib/theme';

const SECTIONS = [
  {
    title: 'Agreement to Terms',
    content: 'By accessing or using Premium Property Rentals, you agree to be bound by these Terms of Service. If you disagree with any part, you may not access the service.',
  },
  {
    title: 'User Accounts',
    content: 'When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your password and for all activities under your account. Notify us immediately of any unauthorized use.',
  },
  {
    title: 'Premium Pass Subscription',
    content: 'The Premium Pass costs $5/month and grants access to landlord contact details. Subscriptions auto-renew unless cancelled. Refunds are provided only for technical issues preventing service access. You may cancel at any time through your account settings.',
  },
  {
    title: 'Landlord Responsibilities',
    content: 'Property listings must be accurate and not misleading. Landlords are responsible for ensuring their properties comply with all applicable laws. We reserve the right to remove listings that violate our policies.',
  },
  {
    title: 'Acceptable Use',
    content: 'You agree not to misuse the service for spam, harassment, fraud, or any illegal activity. You may not scrape, copy, or reproduce listings without permission.',
  },
  {
    title: 'Limitation of Liability',
    content: 'We provide the service "as is" without warranty. We are not liable for any damages arising from your use of the service, including but not limited to failed transactions, property disputes, or data loss.',
  },
  {
    title: 'Changes to Terms',
    content: 'We reserve the right to modify these terms at any time. We will notify users of material changes via email or app notification. Continued use after changes constitutes acceptance.',
  },
  {
    title: 'Contact',
    content: 'For questions about these Terms, please contact us through the app or visit the Contact page.',
  },
];

export default function TermsPage() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: July 2026</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionText}>{s.content}</Text>
          </View>
        ))}
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
  updated: { fontSize: 13, color: colors.gray, marginBottom: 20, fontStyle: 'italic' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  sectionText: { fontSize: 14.5, color: colors.gray, lineHeight: 22 },
});
