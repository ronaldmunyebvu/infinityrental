import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { colors, radius } from '@/app/lib/theme';
import {
  initIapConnection,
  endIapConnection,
  requestIapSubscription,
  verifyIapReceipt,
  restoreIapPurchases,
  IAP_SKUS,
} from '@/app/lib/iap';

type Stage = 'form' | 'processing' | 'done';
type PayMethod = 'google_play' | 'ecocash';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (reference: string) => void;
};

const PAYNOW_GATEWAY_URL = process.env.EXPO_PUBLIC_PAYNOW_GATEWAY_URL || 'http://localhost:3000';
const ECOCASH_ENABLED_ON_ANDROID = process.env.EXPO_PUBLIC_ENABLE_ECOCASH_ON_ANDROID !== 'false';

export default function SubscriptionModal({ visible, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PayMethod>(Platform.OS === 'android' ? 'google_play' : 'ecocash');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [restoring, setRestoring] = useState(false);

  const { user } = useAuth();
  const { subscriberIdentifier, refreshSubscription } = useSubscriber();
  const check = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStage('form');
      setError('');
      setPhone('');
      setReference('');
      setMethod(Platform.OS === 'android' ? 'google_play' : 'ecocash');
      check.setValue(0);
      if (Platform.OS === 'android') {
        initIapConnection();
      }
    } else {
      if (Platform.OS === 'android') {
        endIapConnection();
      }
    }
  }, [visible]);

  const handleGooglePlayPay = async () => {
    setError('');
    setStage('processing');

    const identity = subscriberIdentifier || user?.email || user?.phone || 'anonymous_user';

    try {
      const purchase = await requestIapSubscription(IAP_SKUS.SUBSCRIPTION_1MONTH);
      const token = purchase?.purchaseToken || purchase?.transactionId;

      if (!token) {
        throw new Error('Could not obtain purchase token from Google Play.');
      }

      const res = await verifyIapReceipt(token, IAP_SKUS.SUBSCRIPTION_1MONTH, identity, purchase?.transactionId);
      if (!res.success) {
        throw new Error(res.error || 'Failed to verify subscription with server.');
      }

      await refreshSubscription(identity);
      setReference(`GPLAY-${token.slice(-8)}`);
      setStage('done');
      Animated.spring(check, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    } catch (err: any) {
      setError(err?.message || 'Google Play payment was not completed.');
      setStage('form');
    }
  };

  const handleEcoCashPay = async () => {
    setError('');

    let cleanPhone = phone.replace(/[\s\-\+]+/g, '');
    if (cleanPhone.startsWith('263')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    }
    if (!cleanPhone.startsWith('077') && !cleanPhone.startsWith('078')) {
      setError('Please enter a valid EcoCash number starting with 077 or 078.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('EcoCash number must be 10 digits long (e.g., 077 123 4567).');
      return;
    }

    setStage('processing');
    try {
      const response = await fetch(`${PAYNOW_GATEWAY_URL}/api/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: '1 Month Premium Access',
          mobile: cleanPhone,
          amount: 5,
          authemail: 'infinitymetersolutions@gmail.com',
          subscriber_identifier: subscriberIdentifier || user?.email || user?.phone,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment failed to initiate.');
      }

      // Poll for payment status from Supabase
      let isPaid = false;
      let attempts = 0;
      while (!isPaid && attempts < 24) {
        await new Promise((r) => setTimeout(r, 5000));

        const { data: statusData, error: statusError } = await supabase
          .from('payments')
          .select('status, paynow_reference')
          .eq('reference', data.reference)
          .maybeSingle();

        if (statusError) {
          console.error('Error fetching payment status:', statusError);
        } else if (statusData) {
          if (statusData.status === 'Paid') {
            isPaid = true;
            const trueIdentity = subscriberIdentifier || user?.email || user?.phone;
            if (trueIdentity) {
              await refreshSubscription(trueIdentity);
            }
            setReference(statusData.paynow_reference || data.reference);
            setStage('done');
            Animated.spring(check, { toValue: 1, friction: 4, useNativeDriver: true }).start();
            break;
          } else if (statusData.status === 'Cancelled' || statusData.status === 'Failed') {
            throw new Error('Payment was ' + statusData.status);
          }
        }
        attempts++;
      }

      if (!isPaid && attempts >= 24) {
        throw new Error('Payment timed out. Please try again.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStage('form');
    }
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    setError('');
    const identity = subscriberIdentifier || user?.email || user?.phone || 'anonymous_user';

    try {
      const res = await restoreIapPurchases(identity);
      if (res.restored) {
        await refreshSubscription(identity);
        setReference('RESTORED');
        setStage('done');
        Animated.spring(check, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      } else {
        setError(res.error || 'No active subscription found to restore.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={stage === 'processing' ? undefined : onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header gradient */}
          <View style={styles.header}>
            {stage !== 'processing' && (
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.headerLabel}>Premium Membership</Text>
            </View>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountBig}>$5</Text>
              <Text style={styles.amountSmall}>.00 USD</Text>
            </View>
            <Text style={styles.amountSub}>1 Month Unlimited Access</Text>
          </View>

          <View style={styles.body}>
            {stage === 'form' && (
              <>
                <Text style={styles.desc}>
                  Unlock all landlord contact details and premium property listings for 30 days.
                </Text>

                {/* Method selector if both Google Play and EcoCash are enabled */}
                {(Platform.OS !== 'android' || ECOCASH_ENABLED_ON_ANDROID) && (
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      style={[styles.tab, method === 'google_play' && styles.activeTab]}
                      onPress={() => setMethod('google_play')}
                    >
                      <Ionicons name="logo-google-playstore" size={16} color={method === 'google_play' ? colors.primary : colors.gray} />
                      <Text style={[styles.tabTxt, method === 'google_play' && styles.activeTabTxt]}>Google Play</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, method === 'ecocash' && styles.activeTab]}
                      onPress={() => setMethod('ecocash')}
                    >
                      <Ionicons name="phone-portrait-outline" size={16} color={method === 'ecocash' ? colors.primary : colors.gray} />
                      <Text style={[styles.tabTxt, method === 'ecocash' && styles.activeTabTxt]}>EcoCash</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {method === 'google_play' ? (
                  <View style={styles.methodBox}>
                    <Text style={styles.methodTitle}>Google Play Billing</Text>
                    <Text style={styles.methodSub}>Secure 1-tap subscription managed via your Google account.</Text>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity style={styles.payBtn} onPress={handleGooglePlayPay} activeOpacity={0.85}>
                      <Ionicons name="logo-google-playstore" size={18} color="#fff" />
                      <Text style={styles.payTxt}>Subscribe with Google Play</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.methodBox}>
                    <Text style={styles.label}>EcoCash Number</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.input}
                        placeholder="077 123 4567"
                        placeholderTextColor={colors.lightGray}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={(v) => { setPhone(v); if (error) setError(''); }}
                      />
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity style={styles.payBtn} onPress={handleEcoCashPay} activeOpacity={0.85}>
                      <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
                      <Text style={styles.payTxt}>Pay $5 via EcoCash</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.restoreBtn} onPress={handleRestorePurchases} disabled={restoring}>
                  {restoring ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.restoreTxt}>Restore Previous Purchase</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.secureRow}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                  <Text style={styles.secureTxt}>Encrypted Payment • Cancel Anytime</Text>
                </View>
              </>
            )}

            {stage === 'processing' && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingTitle}>Processing payment...</Text>
                <Text style={styles.processingSub}>
                  {method === 'google_play'
                    ? 'Completing purchase via Google Play...'
                    : 'Check your phone for an EcoCash prompt and enter your PIN.'}
                </Text>
              </View>
            )}

            {stage === 'done' && (
              <View style={styles.center}>
                <Animated.View style={[styles.successCircle, { transform: [{ scale: check }] }]}>
                  <Ionicons name="checkmark" size={40} color="#fff" />
                </Animated.View>
                <Text style={styles.doneTitle}>Subscription Active!</Text>
                <Text style={styles.doneSub}>Ref: {reference}</Text>
                <TouchableOpacity
                  style={[styles.payBtn, { backgroundColor: colors.success }]}
                  onPress={() => { onSuccess?.(reference); onClose(); }}
                >
                  <Text style={styles.payTxt}>View Landlord Contacts</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,30,45,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  header: { backgroundColor: '#0066CC', padding: 24, paddingBottom: 20 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  headerIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  headerLabel: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.9 },
  amountDisplay: { flexDirection: 'row', alignItems: 'flex-end' },
  amountBig: { fontSize: 40, fontWeight: '900', color: '#fff' },
  amountSmall: { fontSize: 16, color: '#fff', opacity: 0.8, marginBottom: 4 },
  amountSub: { fontSize: 13, color: '#fff', opacity: 0.8, marginTop: 4 },
  body: { padding: 24, paddingBottom: 36 },
  desc: { fontSize: 14, color: colors.gray, lineHeight: 20, marginBottom: 16 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: radius.md, padding: 4, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.sm },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabTxt: { fontSize: 13, fontWeight: '600', color: colors.gray },
  activeTabTxt: { color: colors.primary, fontWeight: '700' },
  methodBox: { marginTop: 4 },
  methodTitle: { fontSize: 15, fontWeight: '700', color: colors.charcoal },
  methodSub: { fontSize: 13, color: colors.gray, marginTop: 4, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
  inputWrap: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, height: 54, justifyContent: 'center' },
  input: { fontSize: 16, color: colors.charcoal },
  error: { color: '#E53E3E', fontSize: 13, marginTop: 10 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0066CC', height: 56, borderRadius: radius.md, marginTop: 16 },
  payTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 12 },
  restoreTxt: { fontSize: 13, fontWeight: '600', color: colors.primary },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  secureTxt: { fontSize: 12, color: colors.gray },
  center: { alignItems: 'center', paddingVertical: 20 },
  processingTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal, marginTop: 16 },
  processingSub: { fontSize: 14, color: colors.gray, marginTop: 6, textAlign: 'center' },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.charcoal, marginTop: 16 },
  doneSub: { fontSize: 14, color: colors.gray, marginTop: 4 },
});
