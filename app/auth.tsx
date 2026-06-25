import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/context/AuthContext';
import { colors, radius, shadow } from '@/app/lib/theme';

export default function Auth() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState('tenant');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email || !pass) { setError('Email and password required'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name'); return; }
    setLoading(true);
    const res = mode === 'login'
      ? await signIn(email.trim(), pass)
      : await signUp(email.trim(), pass, name, role, phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    router.replace(role === 'landlord' && mode === 'signup' ? '/landlord' : '/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.close} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.charcoal} />
          </TouchableOpacity>

          <View style={styles.logo}><Ionicons name="home" size={28} color="#fff" /></View>
          <Text style={styles.brand}>NestaRent</Text>
          <Text style={styles.tagline}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, mode === 'login' && styles.tabOn]} onPress={() => setMode('login')}>
              <Text style={[styles.tabTxt, mode === 'login' && styles.tabTxtOn]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, mode === 'signup' && styles.tabOn]} onPress={() => setMode('signup')}>
              <Text style={[styles.tabTxt, mode === 'signup' && styles.tabTxtOn]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>I am a</Text>
              <View style={styles.roleRow}>
                {[{ k: 'tenant', l: 'Tenant', i: 'search' }, { k: 'landlord', l: 'Landlord', i: 'business' }].map((r) => (
                  <TouchableOpacity key={r.k} style={[styles.role, role === r.k && styles.roleOn]} onPress={() => setRole(r.k)} activeOpacity={0.8}>
                    <Ionicons name={r.i as any} size={20} color={role === r.k ? '#fff' : colors.primary} />
                    <Text style={[styles.roleTxt, role === r.k && { color: '#fff' }]}>{r.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input icon="person-outline" placeholder="Full name" value={name} onChange={setName} />
              <Input icon="call-outline" placeholder="Phone number" value={phone} onChange={setPhone} keyboard="phone-pad" />
            </>
          )}

          <Input icon="mail-outline" placeholder="Email address" value={email} onChange={setEmail} keyboard="email-address" />
          <Input icon="lock-closed-outline" placeholder="Password" value={pass} onChange={setPass} secure />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading} activeOpacity={0.88}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>}
          </TouchableOpacity>

          <Text style={styles.terms}>By continuing you agree to our Terms & Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input({ icon, placeholder, value, onChange, secure, keyboard }: any) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color={colors.gray} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.lightGray}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: 24, paddingTop: 10 },
  close: { alignSelf: 'flex-end', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 10, ...shadow },
  brand: { fontSize: 26, fontWeight: '800', color: colors.charcoal, textAlign: 'center', marginTop: 14 },
  tagline: { fontSize: 15, color: colors.gray, textAlign: 'center', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.md, padding: 4, marginTop: 28 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm },
  tabOn: { backgroundColor: colors.primary },
  tabTxt: { fontSize: 14.5, fontWeight: '700', color: colors.gray },
  tabTxtOn: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: colors.charcoal, marginTop: 22, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12 },
  role: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  roleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleTxt: { fontSize: 14.5, fontWeight: '700', color: colors.charcoal },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, height: 54, marginTop: 14 },
  input: { flex: 1, fontSize: 15.5, color: colors.charcoal },
  error: { color: '#E53E3E', fontSize: 13.5, marginTop: 12, textAlign: 'center' },
  btn: { backgroundColor: colors.coral, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnTxt: { color: '#fff', fontSize: 16.5, fontWeight: '700' },
  terms: { fontSize: 12, color: colors.lightGray, textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
