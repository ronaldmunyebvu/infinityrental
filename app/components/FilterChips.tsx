import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/app/lib/theme';
import { PROPERTY_TYPES } from '@/app/lib/data';

export default function FilterChips({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {PROPERTY_TYPES.map((t) => {
        const on = active === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.8}
            onPress={() => onChange(t.key)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Ionicons name={t.icon as any} size={15} color={on ? '#fff' : colors.primary} />
            <Text style={[styles.txt, on && styles.txtOn]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 10, paddingVertical: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  txt: { fontSize: 13.5, fontWeight: '600', color: colors.charcoal },
  txtOn: { color: '#fff' },
});
