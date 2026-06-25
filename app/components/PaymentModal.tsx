import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/lib/supabase';
import { colors, radius } from '@/app/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  userId: string;
  onSuccess: () => void;
};

export default function PaymentModal({ visible, onClose, propertyId, userId, onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<'form' | 'processing' | 'done'>('form');
  const [error, setError] = useState('');
  const check = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) { setStage('form'); setError(''); setPhone(''); check.setValue(0); }
  }, [visible]);

  const pay = async () => {
    setError('');
    setStage('processing');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ecocash-pay', { body: { phone, amount: 1 } });
      if (fnErr || !data?.success) {
        setError(data?.message || 'Payment failed. Try again.');
        setStage('form');
        return;
      }
      await supabase.from('unlocks').upsert({ user_id: userId, property_id: propertyId, transaction_id: data.transaction_id, amount: 1, status: 'success' }, { onConflict: 'user_id,property_id' });
      setStage('done');
      Animated.spring(check, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      setTimeout(() => { onSuccess(); onClose(); }, 1400);
    } catch (e) {
      setError('Something went wrong.');
      setStage('form');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {stage !== 'done' && (
            <TouchableOpacity style={styles.close} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.gray} />
            </TouchableOpacity>
          )}

          {stage === 'done' ? (
            <View style={styles.center}>
              <Animated.View style={[styles.successCircle, { transform: [{ scale: check }] }]}>
                <Ionicons name="checkmark" size={44} color="#fff" />
              </Animated.View>
              <Text style={styles.doneTitle}>Payment Confirmed!</Text>
              <Text style={styles.doneSub}>Owner details unlocked.</Text>
            </View>
          ) : (
            <>
              <View style={styles.ecoLogo}>
                <Ionicons name="phone-portrait" size={22} color="#fff" />
              </View>
              <Text style={styles.title}>Unlock Owner Details</Text>
              <Text style={styles.sub}>Pay a one-time $1.00 fee via EcoCash to reveal the landlord's phone & email.</Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLbl}>Amount</Text>
                <Text style={styles.amount}>$1.00 USD</Text>
              </View>

              <Text style={styles.label}>EcoCash Number</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.prefix}>+263</Text>
                <TextInput
                  style={styles.input}
                  placeholder="77 123 4567"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={stage === 'form'}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.payBtn, stage === 'processing' && { opacity: 0.7 }]}
                onPress={pay}
                disabled={stage === 'processing'}
                activeOpacity={0.85}
              >
                {stage === 'processing' ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.payTxt}>Confirming on EcoCash...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="lock-open" size={17} color="#fff" />
                    <Text style={styles.payTxt}>Pay $1 & Unlock</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.secure}>
                <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                <Text style={styles.secureTxt}>Secured EcoCash transaction</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,30,45,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  close: { position: 'absolute', top: 18, right: 18, zIndex: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  ecoLogo: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '800', color: colors.charcoal },
  sub: { fontSize: 14, color: colors.gray, lineHeight: 20, marginTop: 6 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.seafoam, padding: 16, borderRadius: radius.md, marginTop: 18 },
  amountLbl: { fontSize: 14, color: colors.charcoal, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  label: { fontSize: 13, fontWeight: '700', color: colors.charcoal, marginTop: 18, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 54 },
  prefix: { fontSize: 16, fontWeight: '700', color: colors.charcoal, marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: colors.charcoal },
  error: { color: '#E53E3E', fontSize: 13, marginTop: 10 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.coral, height: 56, borderRadius: radius.md, marginTop: 20 },
  payTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  secureTxt: { fontSize: 12, color: colors.gray },
  center: { alignItems: 'center', paddingVertical: 20 },
  successCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.charcoal, marginTop: 18 },
  doneSub: { fontSize: 14, color: colors.gray, marginTop: 6 },
});
