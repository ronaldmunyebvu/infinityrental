import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, radius, cardShadow } from '@/app/lib/theme';

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, { opacity }]} />
      <View style={styles.body}>
        <Animated.View style={[styles.line, { width: '75%', opacity }]} />
        <Animated.View style={[styles.line, { width: '50%', marginTop: 8, opacity }]} />
        <Animated.View style={[styles.line, { width: '35%', marginTop: 8, opacity }]} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Animated.View style={[styles.badge, { opacity }]} />
          <Animated.View style={[styles.badge, { width: 80, opacity }]} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, marginBottom: 18, ...cardShadow, overflow: 'hidden' },
  image: { width: '100%', height: 190, backgroundColor: colors.border },
  body: { padding: 14 },
  line: { height: 14, borderRadius: 6, backgroundColor: colors.border },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12 },
  badge: { flex: 1, height: 22, borderRadius: 11, backgroundColor: colors.border },
});
