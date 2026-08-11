import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '@/app/lib/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.coral + '15' : colors.primary + '15' }]}>
            <Ionicons name="alert-circle" size={30} color={destructive ? colors.coral : colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelTxt}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, destructive ? styles.confirmBtnDanger : styles.confirmBtn]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmTxt}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,37,64,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    ...shadow,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.charcoal, textAlign: 'center' },
  message: { fontSize: 14, color: colors.gray, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  cancelTxt: { color: colors.charcoal, fontWeight: '600', fontSize: 15 },
  confirmBtn: { backgroundColor: colors.primary },
  confirmBtnDanger: { backgroundColor: colors.coral },
  confirmTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
