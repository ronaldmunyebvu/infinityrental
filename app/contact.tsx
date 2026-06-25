import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/app/lib/theme';

type Category = 'general' | 'support' | 'listing';

const CATEGORY_OPTIONS: { key: Category; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'general', icon: 'help-circle-outline', label: 'General Enquiry' },
  { key: 'support', icon: 'headset-outline', label: 'Support' },
  { key: 'listing', icon: 'call-outline', label: 'Listing Help' },
];

const CRM_URL = 'https://famous.ai/api/crm/6a3951d5617357e677d87356/subscribe';

export default function ContactScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in your name, phone, and message.');
      return;
    }

    setStatus('loading');
    try {
      await fetch(CRM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          full_name: name.trim(),
          source: 'contact-form',
          tags: ['contact', category],
          notes: message.trim(),
        }),
      });
    } catch (_) { /* ignore */ }
    setStatus('done');
  };

  if (status === 'done') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Message Received!</Text>
          <Text style={styles.successDesc}>Thank you for reaching out. Our team will get back to you within 24 hours.</Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => { setStatus('idle'); setName(''); setPhone(''); setMessage(''); }}
            activeOpacity={0.85}
          >
            <Text style={styles.successBtnText}>Send another message</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact info cards */}
        <Text style={styles.sectionTitle}>Reach us directly</Text>

        <TouchableOpacity style={styles.infoCard} onPress={() => Linking.openURL('tel:+263785501259')} activeOpacity={0.7}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="call-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Call Us</Text>
            <Text style={styles.cardValue}>+263 78 550 1259</Text>
            <Text style={styles.cardSub}>Mon – Fri, 8am – 6pm CAT</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} onPress={() => Linking.openURL('https://wa.me/263785501259')} activeOpacity={0.7}>
          <View style={[styles.iconWrap, { backgroundColor: '#10B981' + '15' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>WhatsApp</Text>
            <Text style={[styles.cardValue, { color: '#10B981' }]}>Chat on WhatsApp</Text>
            <Text style={styles.cardSub}>Fastest response time</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoCard} onPress={() => Linking.openURL('mailto:support@rentzimbabwe.com')} activeOpacity={0.7}>
          <View style={[styles.iconWrap, { backgroundColor: '#6366F1' + '15' }]}>
            <Ionicons name="mail-outline" size={22} color="#6366F1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={[styles.cardValue, { color: '#6366F1' }]}>support@rentzimbabwe.com</Text>
            <Text style={styles.cardSub}>We respond within 24 hours</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#F59E0B' + '15' }]}>
            <Ionicons name="location-outline" size={22} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Harare Office</Text>
            <Text style={styles.cardAddr}>Suite 621, 6th Floor Nicozdiamond Insurance Centre</Text>
            <Text style={styles.cardAddr}>30 Samora Machel Avenue, Harare, Zimbabwe</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#F59E0B' + '15' }]}>
            <Ionicons name="location-outline" size={22} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Bulawayo Office</Text>
            <Text style={styles.cardAddr}>Suite E406, 4th Floor Zimdef House</Text>
            <Text style={styles.cardAddr}>Fort Street and 8th Avenue, Bulawayo</Text>
          </View>
        </View>

        {/* Contact form */}
        <View style={[styles.formCard, shadow]}>
          <Text style={styles.formTitle}>Send us a message</Text>
          <Text style={styles.formSub}>Fill in the form and we'll get back to you as soon as possible.</Text>

          {/* Category selector */}
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.categoryBtn, category === c.key && styles.categoryBtnActive]}
                onPress={() => setCategory(c.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={c.icon} size={18} color={category === c.key ? colors.primary : colors.lightGray} />
                <Text style={[styles.categoryText, category === c.key && { color: colors.primary, fontWeight: '700' }]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Moyo"
            placeholderTextColor={colors.lightGray}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Phone / WhatsApp</Text>
          <TextInput
            style={styles.input}
            placeholder="077 123 4567"
            placeholderTextColor={colors.lightGray}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="How can we help you today?"
            placeholderTextColor={colors.lightGray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={[styles.submitBtn, status === 'loading' && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={status === 'loading'}
            activeOpacity={0.85}
          >
            {status === 'loading' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Send Message</Text>
            )}
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
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 12, marginTop: 8 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.white, borderRadius: radius.md, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.charcoal },
  cardValue: { fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: 2 },
  cardSub: { fontSize: 11, color: colors.lightGray, marginTop: 3 },
  cardAddr: { fontSize: 12, color: colors.gray, lineHeight: 18 },
  formCard: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, marginTop: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal, marginBottom: 4 },
  formSub: { fontSize: 13, color: colors.gray, marginBottom: 16 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryBtn: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border,
  },
  categoryBtnActive: { borderColor: colors.primary, backgroundColor: colors.seafoam },
  categoryText: { fontSize: 11, fontWeight: '600', color: colors.lightGray, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.charcoal, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: colors.charcoal, backgroundColor: colors.bg,
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  submitBtn: {
    marginTop: 18, backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#D1FAE5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.charcoal, marginBottom: 8 },
  successDesc: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  successBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: radius.md,
  },
  successBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
