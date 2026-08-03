import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/app/lib/theme';

interface MeshProps {
  children?: React.ReactNode;
  image?: string;
  style?: StyleProp<ViewStyle>;
  overlayOpacity?: number;
}

// Approximation of the website's `bg-mesh` utility: deep navy base with
// layered blue radial "mesh" glows, optionally over a hero image.
export default function Mesh({ children, image, style, overlayOpacity = 0.68 }: MeshProps) {
  return (
    <View style={[styles.base, style]}>
      {image && <ImageBackground source={{ uri: image }} style={StyleSheet.absoluteFill} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(10,37,64,${overlayOpacity})` }]} />
      <LinearGradient
        colors={['rgba(0,102,204,0.32)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { top: 0, height: '45%' }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,102,204,0.26)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { bottom: 0, height: '55%' }]}
      />
      <LinearGradient
        colors={['rgba(124,196,255,0.22)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { top: '10%', right: 0, width: '55%', height: '60%' }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.navy,
    overflow: 'hidden',
  },
});
