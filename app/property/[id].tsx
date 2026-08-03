import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { useFavorites } from '@/app/context/FavoritesContext';
import { colors, radius, shadow, cardShadow } from '@/app/lib/theme';
import { Property } from '@/app/lib/types';
import { amenityIcon } from '@/app/lib/data';
import { formatRelativeTime } from '@/app/lib/utils';
import SubscriptionModal from '@/app/components/SubscriptionModal';

const W = Dimensions.get('window').width;

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { subscriberIdentifier, hasSubscription, refreshSubscription } = useSubscriber();
  const { isFav, toggleFav } = useFavorites();
  const [prop, setProp] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeId = user?.email || subscriberIdentifier || user?.phone;
  const isOwner = Boolean(prop && activeId && prop.email_number && prop.email_number === activeId);

  const load = useCallback(async () => {
    const { data } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
    const p = data as Property;
    setProp(p);
    const isOwnerCheck = Boolean(p && activeId && p.email_number && p.email_number === activeId);
    setUnlocked(hasSubscription || isOwnerCheck);
    setLoading(false);
  }, [id, user, subscriberIdentifier, hasSubscription]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (prop?.id) {
      supabase.rpc('increment_property_views', { prop_id: prop.id }).then(({ error }) => {
        if (error) console.error('Failed to increment views:', error);
      });
    }
  }, [prop?.id]);

  const onUnlock = () => {
    if (!user && !subscriberIdentifier) { router.push('/auth'); return; }
    setShowPay(true);
  };

  if (loading || !prop) {
    return <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const imgs = prop.images || [];
  const shortDesc = prop.description?.slice(0, 150);
  const isLong = (prop.description?.length || 0) > 150;
  const relativeTime = formatRelativeTime(prop.created_at);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
          >
            {(imgs.length > 0 ? imgs : ['https://via.placeholder.com/400x320']).map((img, i) => (
              <Image key={i} source={{ uri: img }} style={{ width: W, height: 320 }} />
            ))}
          </ScrollView>
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.charcoal} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {isOwner && (
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/edit-property?id=${prop.id}`)}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconBtn} onPress={async () => { const ok = await toggleFav(prop.id); if (!ok) router.push('/auth'); }}>
                <Ionicons name={isFav(prop.id) ? 'heart' : 'heart-outline'} size={20} color={isFav(prop.id) ? colors.coral : colors.charcoal} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {imgs.length > 0 && (
            <View style={styles.imgCounter}>
              <Text style={styles.imgCounterTxt}>{imgIdx + 1} / {imgs.length}</Text>
            </View>
          )}
          <View style={styles.dots}>
            {imgs.map((_, i) => (
              <View key={i} style={[styles.dot, i === imgIdx && styles.dotOn]} />
            ))}
          </View>
        </View>

        {/* Thumbnail strip */}
        {imgs.length > 1 && (
          <View style={styles.thumbRow}>
            {imgs.slice(0, 5).map((src, i) => (
              <TouchableOpacity key={i} onPress={() => setImgIdx(i)} activeOpacity={0.8}>
                <Image source={{ uri: src }} style={[styles.thumb, imgIdx === i && styles.thumbOn]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.typeRow}>
            <View style={styles.typeChip}><Text style={styles.typeTxt}>{prop.property_type?.toUpperCase()}</Text></View>
            {prop.featured && <View style={[styles.typeChip, { backgroundColor: colors.coral }]}><Text style={[styles.typeTxt, { color: '#fff' }]}>FEATURED</Text></View>}
            {relativeTime && (
              <View style={[styles.typeChip, { backgroundColor: colors.border }]}>
                <Ionicons name="time-outline" size={11} color={colors.gray} />
                <Text style={[styles.typeTxt, { color: colors.gray }]}>{relativeTime}</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{prop.title}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={15} color={colors.coral} />
            <Text style={styles.loc}>{prop.location}</Text>
            {prop.rating != null && (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={13} color={colors.star} />
                <Text style={styles.ratingChipTxt}>{Number(prop.rating).toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceBig}>${prop.price}</Text>
              <Text style={styles.priceUnit}>{prop.price_period || 'per month'}</Text>
            </View>
            <View style={styles.specsRow}>
              <Spec icon="bed-outline" label={`${prop.bedrooms} Beds`} />
              <Spec icon="water-outline" label={`${prop.bathrooms} Baths`} />
              {prop.area && <Spec icon="resize-outline" label={`${prop.area}m²`} />}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>
            {expanded || !isLong ? prop.description : `${shortDesc}...`}
            {isLong && (
              <Text onPress={() => setExpanded(!expanded)} style={styles.readMore}>
                {' '}{expanded ? 'Read less' : 'Read more'}
              </Text>
            )}
          </Text>

          {prop.amenities?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenGrid}>
                {prop.amenities.map((a) => (
                  <View key={a} style={styles.amen}>
                    <Ionicons name={amenityIcon(a)} size={18} color={colors.primary} />
                    <Text style={styles.amenTxt}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.map}>
            <Ionicons name="map" size={36} color={colors.primary} />
            <Text style={styles.mapTxt}>{prop.location}</Text>
            {prop.latitude && prop.longitude && (
              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${prop.latitude},${prop.longitude}`)}
              >
                <Text style={styles.mapBtnTxt}>Open in Maps</Text>
                <Ionicons name="open-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Owner contact */}
          <Text style={styles.sectionTitle}>Owner Contact</Text>
          {isOwner ? (
            <View style={styles.ownerCard}>
              <View style={styles.ownerHead}>
                <View style={styles.ownerAvatar}><Text style={styles.ownerInit}>{(prop.contact_name || 'O')[0]}</Text></View>
                <View>
                  <Text style={styles.ownerName}>{prop.contact_name || 'Owner'}</Text>
                  <Text style={styles.ownerRole}>You own this listing</Text>
                </View>
              </View>
              <ContactRow icon="call" label={prop.contact_phone || ''} onPress={() => Linking.openURL(`tel:${prop.contact_phone}`)} />
              <ContactRow icon="logo-whatsapp" label="WhatsApp" green onPress={() => Linking.openURL(`https://wa.me/${(prop.contact_whatsapp || '').replace(/\D/g, '')}`)} />
              <ContactRow icon="mail" label={prop.contact_email || ''} onPress={() => Linking.openURL(`mailto:${prop.contact_email}`)} />
            </View>
          ) : unlocked ? (
            <View style={styles.ownerCard}>
              <View style={styles.ownerHead}>
                <View style={styles.ownerAvatar}><Text style={styles.ownerInit}>{(prop.contact_name || 'L')[0]}</Text></View>
                <View>
                  <Text style={styles.ownerName}>{prop.contact_name || 'Landlord'}</Text>
                  <Text style={styles.ownerRole}>Verified Landlord</Text>
                </View>
              </View>
              <ContactRow icon="call" label={prop.contact_phone || ''} onPress={() => Linking.openURL(`tel:${prop.contact_phone}`)} />
              <ContactRow icon="logo-whatsapp" label="WhatsApp" green onPress={() => Linking.openURL(`https://wa.me/${(prop.contact_whatsapp || '').replace(/\D/g, '')}`)} />
              <ContactRow icon="mail" label={prop.contact_email || ''} onPress={() => Linking.openURL(`mailto:${prop.contact_email}`)} />
            </View>
          ) : (
            <View style={styles.lockedCard}>
              <View style={styles.lockedBlur}>
                <Ionicons name="lock-closed" size={30} color={colors.primary} />
                <Text style={styles.lockedTitle}>Contact Locked</Text>
                <Text style={styles.lockedSub}>Unlock all landlords&apos; contacts for a $5 monthly fee.</Text>
                <TouchableOpacity style={styles.lockedBtn} activeOpacity={0.88} onPress={onUnlock}>
                  <Ionicons name="lock-open" size={16} color="#fff" />
                  <Text style={styles.lockedBtnTxt}>Unlock All Contacts for $5/mo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Contact us link */}
          <TouchableOpacity style={styles.contactUs} onPress={() => router.push('/contact')} activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.gray} />
            <Text style={styles.contactUsTxt}>Have a question about this listing? Contact us</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      {!unlocked && !isOwner && (
        <SafeAreaView edges={['bottom']} style={styles.cta}>
          <TouchableOpacity style={styles.unlockBtn} activeOpacity={0.88} onPress={onUnlock}>
            <Ionicons name="lock-open" size={19} color="#fff" />
            <Text style={styles.unlockTxt}>Unlock All Contacts for $5/mo</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <SubscriptionModal
        visible={showPay}
        onClose={() => setShowPay(false)}
        onSuccess={() => { refreshSubscription(); setUnlocked(true); }}
      />
    </View>
  );
}

function Spec({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.specTxt}>{label}</Text>
    </View>
  );
}

function ContactRow({ icon, label, onPress, green }: { icon: any; label: string; onPress: () => void; green?: boolean }) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.contactIcon, green && { backgroundColor: '#E7F7EF' }]}>
        <Ionicons name={icon} size={18} color={green ? '#25D366' : colors.primary} />
      </View>
      <Text style={styles.contactTxt}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.lightGray} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...shadow },
  imgCounter: { position: 'absolute', top: 56, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  imgCounterTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  dots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotOn: { width: 20, backgroundColor: '#fff' },
  thumbRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: -16, marginBottom: 4 },
  thumb: { width: 60, height: 45, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', opacity: 0.6 },
  thumbOn: { borderColor: colors.primary, opacity: 1 },
  body: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, padding: 22 },
  typeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.seafoam, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  typeTxt: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  title: { fontSize: 25, fontWeight: '800', color: colors.charcoal, marginTop: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  loc: { fontSize: 14, color: colors.gray, flex: 1 },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF5EB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  ratingChipTxt: { fontSize: 12, fontWeight: '700', color: colors.coral },
  priceCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...cardShadow },
  priceBig: { fontSize: 26, fontWeight: '800', color: colors.primary },
  priceUnit: { fontSize: 12, color: colors.gray, marginTop: 2 },
  specsRow: { flexDirection: 'row', gap: 14 },
  spec: { alignItems: 'center', gap: 4 },
  specTxt: { fontSize: 11.5, color: colors.charcoal, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal, marginTop: 26, marginBottom: 12 },
  desc: { fontSize: 14.5, color: colors.gray, lineHeight: 23 },
  readMore: { color: colors.primary, fontWeight: '700' },
  amenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amen: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.md, width: (W - 54) / 2, ...cardShadow },
  amenTxt: { fontSize: 13.5, color: colors.charcoal, fontWeight: '600' },
  map: { backgroundColor: colors.seafoam, height: 160, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapTxt: { fontSize: 14, color: colors.charcoal, fontWeight: '600' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, marginTop: 4 },
  mapBtnTxt: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  ownerCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, ...cardShadow },
  ownerHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 6 },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ownerInit: { color: '#fff', fontSize: 20, fontWeight: '800' },
  ownerName: { fontSize: 16, fontWeight: '700', color: colors.charcoal },
  ownerRole: { fontSize: 12.5, color: colors.success, fontWeight: '600', marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  contactIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.seafoam, alignItems: 'center', justifyContent: 'center' },
  contactTxt: { flex: 1, fontSize: 14.5, color: colors.charcoal, fontWeight: '600' },
  lockedCard: { borderRadius: radius.lg, overflow: 'hidden' },
  lockedBlur: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 34, gap: 6, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.lg },
  lockedTitle: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginTop: 6 },
  lockedSub: { fontSize: 13, color: colors.gray, textAlign: 'center', paddingHorizontal: 20 },
  lockedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md, marginTop: 16 },
  lockedBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  contactUs: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  contactUsTxt: { fontSize: 13, color: colors.gray },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.coral, height: 56, borderRadius: radius.md },
  unlockTxt: { color: '#fff', fontSize: 16.5, fontWeight: '700' },
});
