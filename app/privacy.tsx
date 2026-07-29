import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius } from '@/app/lib/theme';

const SECTIONS = [
  {
    title: 'Introduction',
    content: 'Premium Property Rentals ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.',
  },
  {
    title: 'Information We Collect',
    content: 'We collect personal information you provide when registering, listing properties, or contacting us. This includes your name, email address, phone number, and property details. We also automatically collect device information, usage data, and location information when you use our app.',
  },
  {
    title: 'How We Use Your Information',
    content: 'We use your information to provide and maintain our service, process transactions, send notifications, improve user experience, and communicate with you about your account or listings.',
  },
  {
    title: 'Data Security',
    content: 'We implement industry-standard security measures including encryption, secure socket layer technology, and regular security audits to protect your personal information. However, no method of transmission over the Internet is 100% secure.',
  },
  {
    title: 'Third-Party Services',
    content: 'We may employ third-party services for payment processing (EcoCash/Paynow), analytics, and infrastructure. These providers have access to your information only to perform tasks on our behalf and are obligated not to disclose or use it for any other purpose.',
  },
  {
    title: 'Your Rights',
    content: 'You have the right to access, update, or delete your personal information at any time. You can manage your account settings within the app or contact us directly for assistance.',
  },
  {
    title: 'Contact Us',
    content: 'If you have questions about this Privacy Policy, please contact us through our app or visit the Contact page.',
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
