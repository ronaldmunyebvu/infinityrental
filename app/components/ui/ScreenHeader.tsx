import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts } from '@/app/lib/theme';
import Mesh from '@/app/components/ui/Mesh';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  mesh?: boolean;
}

export default function ScreenHeader({ title, subtitle, right, style, mesh = true }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <Mesh style={[styles.root, style]} image={mesh ? undefined : undefined}>
      <SafeAreaView edges={['top']}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </TouchableOpacity>
          {right}
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </SafeAreaView>
    </Mesh>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: 22,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  titleBlock: { marginTop: 16 },
  title: {
    color: colors.white,
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    fontSize: 26,
  },
  subtitle: {
    color: colors.lightBlue,
    fontSize: 14,
    marginTop: 4,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
});
