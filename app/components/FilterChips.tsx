import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/app/lib/theme';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'Apartment', label: 'Apartment', icon: 'business-outline' },
  { key: 'House', label: 'House', icon: 'home-outline' },
  { key: 'Office Space', label: 'Office', icon: 'briefcase-outline' },
  { key: 'Shop / Retail', label: 'Shop', icon: 'storefront-outline' },
  { key: 'Warehouse', label: 'Warehouse', icon: 'cube-outline' },
  { key: 'Student Accommodation', label: 'Student', icon: 'school-outline' },
  { key: 'Short letting', label: 'Short Let', icon: 'time-outline' },
];

export default function FilterChips({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {FILTER_OPTIONS.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.chip, active === t.key && styles.chipOn]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.8}
        >
          <Ionicons name={t.icon as any} size={14} color={active === t.key ? '#fff' : colors.primary} />
          <Text style={[styles.txt, active === t.key && { color: '#fff' }]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8, paddingVertical: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  txt: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
});
