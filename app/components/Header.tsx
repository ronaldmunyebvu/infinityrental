import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts } from '@/app/lib/theme';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { useFavorites } from '@/app/context/FavoritesContext';

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscriberIdentifier, subscriberFirstName } = useSubscriber();
  const { count } = useFavorites();
  const isLoggedIn = !!user || !!subscriberIdentifier;

  let initial = '?';
  if (user) {
    const fn = (user as any).user_metadata?.first_name as string | undefined;
    initial = fn ? fn.charAt(0).toUpperCase() : (user.email || '?').charAt(0).toUpperCase();
  } else if (subscriberFirstName) {
    initial = subscriberFirstName.charAt(0).toUpperCase();
  } else if (subscriberIdentifier) {
    initial = subscriberIdentifier.charAt(0).toUpperCase();
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <BlurView intensity={40} tint="light" style={styles.bar}>
        <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.8} style={styles.logoWrap}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        </TouchableOpacity>

        <View style={styles.actions}>
          {isLoggedIn && (
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/favorites')}
            >
              <Ionicons name="heart-outline" size={22} color={colors.primary} />
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/add-property')}>
            <LinearGradient
              colors={['#0066CC', '#0080FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.listBtn}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.listTxt}>List Property</Text>
            </LinearGradient>
          </TouchableOpacity>

          {isLoggedIn ? (
            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.8}
              onPress={() => router.push('/landlord')}
            >
              <Text style={styles.avatarTxt}>{initial}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/auth')}
            >
              <Ionicons name="person-outline" size={16} color={colors.primary} />
              <Text style={styles.signInTxt}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'rgba(255,255,255,0.92)' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  logo: { height: 48, width: 72 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,246,255,0.6)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800', fontFamily: fonts.bold },
  listBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
  },
  listTxt: { color: '#fff', fontSize: 13.5, fontWeight: '700', fontFamily: fonts.semibold },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarTxt: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: fonts.bold },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#fff',
  },
  signInTxt: { color: colors.primary, fontSize: 13.5, fontWeight: '700', fontFamily: fonts.semibold },
});
