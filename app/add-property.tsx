import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { colors, radius } from '@/app/lib/theme';
import { PROPERTY_TYPES, AMENITIES } from '@/app/lib/data';

const IMAGE_POOL = [
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287379020_eeaff440.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287396551_bb6d66a7.png',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287381396_a4108446.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287456614_f9f1bf2d.png',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287448375_db0e28a3.png',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287442243_66a97272.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287488854_b1680c32.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287490338_987c6823.jpg',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287465877_f3a7d215.png',
  'https://d64gsuwffb70l.cloudfront.net/6a3b8ba1dd44bfd49bd2cbd5_1782287502652_194d777e.png',
];

const TYPES = PROPERTY_TYPES.filter((t) => t.key !== 'all');

export default function AddProperty() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('apartment');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [beds, setBeds] = useState(1);
  const [baths, setBaths] = useState(1);
  const [area, setArea] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [saving, setSaving] = useState(false);

  const toggleImg = (img: string) => setImages((p) => p.includes(img) ? p.filter((x) => x !== img) : [...p, img]);
  const toggleAmen = (a: string) => setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);

  const save = async () => {
    if (!title || !price || !location || images.length === 0) {
      Alert.alert('Missing info', 'Please add a title, price, location, and at least one photo.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('properties').insert({
      owner_id: user.id,
      title, description: desc, type,
      price: Number(price), location,
      bedrooms: beds, bathrooms: baths, area: Number(area) || 0,
      images, amenities,
      owner_name: profile?.full_name, owner_phone: phone, owner_email: email, owner_whatsapp: phone,
      latitude: -17.8 + Math.random() * 0.1, longitude: 31.05 + Math.random() * 0.1,
      featured: false,
    });
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'Property listed successfully!', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.close}><Ionicons name="close" size={24} color={colors.charcoal} /></TouchableOpacity>
        <Text style={styles.hTitle}>Add Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Label text="Property Photos" hint={`${images.length} selected`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {IMAGE_POOL.map((img) => {
              const on = images.includes(img);
              return (
                <TouchableOpacity key={img} onPress={() => toggleImg(img)} activeOpacity={0.85}>
                  <Image source={{ uri: img }} style={[styles.pick, on && styles.pickOn]} />
                  {on && <View style={styles.pickCheck}><Ionicons name="checkmark" size={14} color="#fff" /></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Label text="Title" />
          <Field value={title} onChange={setTitle} placeholder="e.g. Modern 2-Bed Apartment" />

          <Label text="Description" />
          <Field value={desc} onChange={setDesc} placeholder="Describe your property..." multiline />

          <Label text="Property Type" />
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity key={t.key} style={[styles.typeChip, type === t.key && styles.typeChipOn]} onPress={() => setType(t.key)}>
                <Ionicons name={t.icon as any} size={16} color={type === t.key ? '#fff' : colors.primary} />
                <Text style={[styles.typeTxt, type === t.key && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Label text="Price ($/mo)" />
              <Field value={price} onChange={setPrice} placeholder="850" keyboard="numeric" />
            </View>
            <View style={styles.col}>
              <Label text="Area (m²)" />
              <Field value={area} onChange={setArea} placeholder="110" keyboard="numeric" />
            </View>
          </View>

          <Label text="Location" />
          <Field value={location} onChange={setLocation} placeholder="e.g. Borrowdale, Harare" />

          <View style={styles.twoCol}>
            <Counter label="Bedrooms" value={beds} onChange={setBeds} />
            <Counter label="Bathrooms" value={baths} onChange={setBaths} />
          </View>

          <Label text="Amenities" />
          <View style={styles.amenWrap}>
            {AMENITIES.map((a) => {
              const on = amenities.includes(a.key);
              return (
                <TouchableOpacity key={a.key} style={[styles.amenChip, on && styles.amenChipOn]} onPress={() => toggleAmen(a.key)}>
                  <Ionicons name={a.icon as any} size={15} color={on ? '#fff' : colors.primary} />
                  <Text style={[styles.amenTxt, on && { color: '#fff' }]}>{a.key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Label text="Contact Phone (shown after unlock)" />
          <Field value={phone} onChange={setPhone} placeholder="+263 77 123 4567" keyboard="phone-pad" />
          <Label text="Contact Email" />
          <Field value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" />

          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="cloud-upload-outline" size={19} color="#fff" /><Text style={styles.saveTxt}>Publish Listing</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{text}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function Field({ value, onChange, placeholder, multiline, keyboard }: any) {
  return (
    <TextInput
      style={[styles.field, multiline && { height: 90, textAlignVertical: 'top', paddingTop: 14 }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.lightGray}
      multiline={multiline}
      keyboardType={keyboard}
      autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
    />
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.col}>
      <Label text={label} />
      <View style={styles.counter}>
        <TouchableOpacity onPress={() => onChange(Math.max(1, value - 1))} style={styles.cBtn}><Ionicons name="remove" size={18} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.cVal}>{value}</Text>
        <TouchableOpacity onPress={() => onChange(value + 1)} style={styles.cBtn}><Ionicons name="add" size={18} color={colors.primary} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', color: colors.charcoal },
  hint: { fontSize: 12.5, color: colors.primary, fontWeight: '600' },
  pick: { width: 100, height: 80, borderRadius: radius.sm, backgroundColor: colors.seafoam, borderWidth: 2.5, borderColor: 'transparent' },
  pickOn: { borderColor: colors.primary },
  pickCheck: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  field: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 52, fontSize: 15, color: colors.charcoal },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  typeChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeTxt: { fontSize: 13.5, fontWeight: '600', color: colors.charcoal },
  twoCol: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 8, height: 52 },
  cBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.seafoam, alignItems: 'center', justifyContent: 'center' },
  cVal: { fontSize: 16, fontWeight: '700', color: colors.charcoal },
  amenWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  amenChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  amenTxt: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.coral, height: 56, borderRadius: radius.md, marginTop: 30 },
  saveTxt: { color: '#fff', fontSize: 16.5, fontWeight: '700' },
});
