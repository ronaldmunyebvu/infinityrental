import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, cardShadow, radius } from '@/app/lib/theme';
import { Property } from '@/app/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { useFavorites } from '@/app/context/FavoritesContext';
import { formatRelativeTime } from '@/app/lib/utils';

export default function PropertyCard({ item }: { item: Property }) {
  const router = useRouter();
  const { user } = useAuth();
  const { subscriberIdentifier, hasSubscription } = useSubscriber();
  const { isFav, toggleFav } = useFavorites();
  const fav = isFav(item.id);
  const scale = useRef(new Animated.Value(1)).current;
  const heart = useRef(new Animated.Value(1)).current;
  const relativeTime = formatRelativeTime(item.created_at);
  const isOwner = Boolean(
    item && (
      item.user_id === user?.id ||
      item.contact_email === user?.email ||
      item.contact_phone === subscriberIdentifier
    )
  );
  const unlocked = hasSubscription || isOwner;

  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, friction: 4, tension: 300, useNativeDriver: true }).start();

  const tapHeart = async () => {
    Animated.sequence([
      Animated.timing(heart, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(heart, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    const ok = await toggleFav(item.id);
    if (!ok) router.push('/auth');
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={() => router.push(`/property/${item.id}`)}
        style={styles.card}
      >
        <View style={styles.imgWrap}>
          <Image source={{ uri: item.images?.[0] }} style={styles.img} />
          {item.property_type && (
            <View style={styles.badge}>
              <Ionicons name="home" size={11} color="#fff" />
              <Text style={styles.badgeTxt}>{item.property_type}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.heart} onPress={tapHeart} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: heart }] }}>
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? colors.coral : colors.charcoal} />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.priceTag}>
            <Text style={styles.priceTxt}>${item.price}</Text>
            <Text style={styles.priceSub}>/mo</Text>
          </View>
          {relativeTime && (
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={10} color="#fff" />
              <Text style={styles.timeTxt}>{relativeTime}</Text>
            </View>
          )}
          {item.rating != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color="#fff" />
              <Text style={styles.ratingTxt}>{Number(item.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={13} color={colors.gray} />
            <Text style={styles.loc} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.specs}>
            <View style={styles.spec}>
              <Ionicons name="bed-outline" size={14} color={colors.primary} />
              <Text style={styles.specTxt}>{item.bedrooms} Bed</Text>
            </View>
            <View style={styles.spec}>
              <Ionicons name="water-outline" size={14} color={colors.primary} />
              <Text style={styles.specTxt}>{item.bathrooms} Bath</Text>
            </View>
            {item.views != null && (
              <View style={styles.spec}>
                <Ionicons name="eye-outline" size={14} color={colors.primary} />
                <Text style={styles.specTxt}>{item.views}</Text>
              </View>
            )}
            {item.likes != null && (
              <View style={styles.spec}>
                <Ionicons name="heart-outline" size={14} color={colors.primary} />
                <Text style={styles.specTxt}>{item.likes}</Text>
              </View>
            )}
          </View>
          {unlocked ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={13} color={colors.gray} />
              <Text style={styles.contactTxt} numberOfLines={1}>{item.contact_phone}</Text>
            </View>
          ) : item.contact_phone && (
            <View style={styles.contactRow}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.lightGray} />
              <Text style={[styles.contactTxt, { color: colors.lightGray }]}>Contact locked</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, marginBottom: 18, ...cardShadow },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 190, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, backgroundColor: colors.seafoam },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: colors.coral, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, gap: 4 },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heart: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.92)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  priceTag: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(10,126,164,0.95)', flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  priceTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  priceSub: { color: '#e0f0f5', fontSize: 11, fontWeight: '600', marginBottom: 2, marginLeft: 1 },
  timeBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(45,55,72,0.75)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, gap: 3 },
  timeTxt: { color: '#fff', fontSize: 10, fontWeight: '600' },
  ratingBadge: { position: 'absolute', top: 12, right: 52, backgroundColor: 'rgba(255,107,53,0.9)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, gap: 3 },
  ratingTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: '700', color: colors.charcoal },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  loc: { fontSize: 12.5, color: colors.gray, flex: 1 },
  specs: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specTxt: { fontSize: 12.5, color: colors.charcoal, fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  contactTxt: { fontSize: 12, color: colors.gray },
});
