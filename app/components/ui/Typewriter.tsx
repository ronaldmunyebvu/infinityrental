import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, TextStyle, View } from 'react-native';
import { fonts } from '@/app/lib/theme';

const PHRASES = [
  'Find your next home,\nget the $5 monthly pass.',
  'Discover premium stays,\nwithout the hassle.',
  'Rentals made easy,\nsecure and affordable.',
];

interface TypewriterProps {
  style?: TextStyle;
  color?: string;
  accentColor?: string;
  fontSize?: number;
}

export default function Typewriter({ style, color = '#FFFFFF', accentColor = '#7CC4FF', fontSize = 30 }: TypewriterProps) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [caret, setCaret] = useState(true);

  useEffect(() => {
    const full = PHRASES[phraseIdx];
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (i <= full.length) {
        setTyped(full.slice(0, i));
        i += 1;
        timeout = setTimeout(type, 45);
      } else {
        timeout = setTimeout(() => {
          setPhraseIdx((p) => (p + 1) % PHRASES.length);
          setTyped('');
        }, 2800);
      }
    };
    type();
    return () => clearTimeout(timeout);
  }, [phraseIdx]);

  useEffect(() => {
    const blink = setInterval(() => setCaret((c) => !c), 520);
    return () => clearInterval(blink);
  }, []);

  const [line1, line2] = typed.split('\n');

  return (
    <View>
      <Text style={[styles.base, { fontSize, color }, style]}>
        {line1}
        {line1 && line2 != null && '\n'}
        {line2 ? <Text style={{ color: accentColor }}>{line2}</Text> : null}
        <Text style={[styles.caret, { color: accentColor, fontSize: fontSize * 0.92 }]}>{caret ? '|' : ''}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.extrabold,
    fontWeight: '800',
    lineHeight: 1.15,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  caret: {
    marginLeft: 2,
  },
});
