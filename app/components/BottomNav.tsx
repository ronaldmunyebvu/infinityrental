import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { colors, shadow, radius } from '@/app/lib/theme';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useAuth } from '@/app/context/AuthContext';

type Tab = 'home' | 'favorites' | 'portal' | 'more';

const TABS: { key: Tab; label: string; icon: any; route: string }[] = [
  { key: 'home', label: 'Explore', icon: 'compass-outline', route: '/' },
  { key: 'favorites', label: 'Saved', icon: 'heart-outline', route: '/favorites' },
  { key: 'portal', label: 'Portal', icon: 'business-outline', route: '/landlord' },
  { key: 'more', label: 'More', icon: 'menu-outline', route: '/more' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useFavorites();

  const active: Tab = pathname === '/favorites'
    ? 'favorites'
    : pathname === '/landlord'
    ? 'portal'
    : pathname === '/more'
    ? 'more'
    : 'home';

  const go = (t: typeof TABS[number]) => {
    if ((t.key === 'favorites' || t.key === 'portal') && !user) { router.push('/auth'); return; }
    if (t.key === active) return;
    router.replace(t.route as any);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {TABS.map((t) => {
          const on = active === t.key;
          return (
            <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.8} onPress={() => go(t)}>
              <View>
                <Ionicons name={on ? (t.icon.replace('-outline', '') as any) : t.icon} size={23} color={on ? colors.primary : colors.lightGray} />
                {t.key === 'favorites' && count > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeTxt}>{count}</Text></View>
                )}
              </View>
              <Text style={[styles.lbl, on && { color: colors.primary, fontWeight: '700' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  bar: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  lbl: { fontSize: 11, color: colors.lightGray, fontWeight: '600' },
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
