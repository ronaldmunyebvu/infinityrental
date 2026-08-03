import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, shadow } from '@/app/lib/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  height?: number;
  fontSize?: number;
}

export default function GradientButton({
  label,
  onPress,
  icon,
  style,
  disabled,
  height = 56,
  fontSize = 16,
}: GradientButtonProps) {
  return (
    <TouchableOpacity activeOpacity={disabled ? 1 : 0.85} disabled={disabled} onPress={onPress} style={style}>
      <LinearGradient
        colors={disabled ? ['#9FBBD9', '#9FBBD9'] : ['#0066CC', '#0080FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.btn, { height }, disabled && { opacity: 0.7 }]}
      >
        {icon}
        <Text style={[styles.label, { fontSize }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.sm,
    ...shadow,
  },
  label: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
