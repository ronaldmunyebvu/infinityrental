import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/app/context/AuthContext';
import { useSubscriber } from '@/app/context/SubscriberContext';
import { colors, radius, shadow } from '@/app/lib/theme';

type ModalMode = 'signin' | 'signup' | 'forgot' | 'update_password';
type ForgotStep = 1 | 2 | 3;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function isEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function isPhone(value: string): boolean {
  return value.trim().length > 0 && !isEmail(value);
}

type Props = {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onSuccess?: (role?: string) => void;
};

export default function AuthModal({ visible, onClose, initialMode = 'signin', onSuccess }: Props) {
  const { signIn, signUp, verifyAuthOtpAndReset } = useAuth();
  const { loginSubscriber, registerSubscriber, sendSubscriberOtp, sendSubscriberRegOtp, verifySubscriberRegOtp, verifySubscriberOtpAndReset } = useSubscriber();

  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign-up phone verification state
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupOtpDigits, setSignupOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [signupDevOtp, setSignupDevOtp] = useState<string | undefined>();
  const [signupCountdown, setSignupCountdown] = useState(0);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');

  // Forgot password flow
  const [forgotStep, setForgotStep] = useState<ForgotStep>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signupCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (signupCountdownRef.current) clearInterval(signupCountdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setError('');
      setSignupStep(1);
      setForgotStep(1);
      setIdentifier('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [visible]);

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(RESEND_COOLDOWN);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  const startSignupCountdown = useCallback(() => {
    if (signupCountdownRef.current) clearInterval(signupCountdownRef.current);
    setSignupCountdown(RESEND_COOLDOWN);
    signupCountdownRef.current = setInterval(() => {
      setSignupCountdown((c) => {
        if (c <= 1) { clearInterval(signupCountdownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  const clearForgotState = () => {
    setForgotStep(1);
    setForgotIdentifier('');
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setDevOtp(undefined);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setForgotSuccess(false);
    setResetEmailSent(false);
    setError('');
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(0);
  };

  const switchMode = (next: ModalMode) => {
    setError('');
    if (next !== 'forgot') clearForgotState();
    setSignupStep(1);
    setSignupFirstName('');
    setSignupLastName('');
    setSignupOtpDigits(Array(OTP_LENGTH).fill(''));
    setSignupDevOtp(undefined);
    setSignupCountdown(0);
    if (signupCountdownRef.current) clearInterval(signupCountdownRef.current);
    setMode(next);
  };

  const validateIdentifier = (val: string): string | null => {
    if (!val.trim()) return 'Please enter your email or phone number.';
    if (isEmail(val)) return null;
    if (val.replace(/\D/g, '').length < 7) return 'Please enter a valid phone number.';
    return null;
  };

  // ─── SIGN IN / SIGN UP SUBMIT ──────────────────────────────────────────
  const handleAuthSubmit = async () => {
    setError('');
    const idError = validateIdentifier(identifier);
    if (idError) { setError(idError); return; }
    if (mode === 'signup' && (!signupFirstName.trim() || !signupLastName.trim())) { setError('First and Last name are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);

    // Phone sign-up: send OTP first
    if (mode === 'signup' && isPhone(identifier)) {
      const res = await sendSubscriberRegOtp(identifier);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      setSignupDevOtp(res.otp);
      startSignupCountdown();
      setSignupStep(2);
      return;
    }

    // Email sign-up / sign-in
    if (isEmail(identifier)) {
      const res = mode === 'signin'
        ? await signIn(identifier, password)
        : await signUp(identifier, password, 'owner', signupFirstName.trim(), signupLastName.trim());
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.needsEmailVerification) {
        setSignupSuccessMsg("We've sent a confirmation link to your email. Please click the link to verify your account.");
        return;
      }
      onClose();
      if (onSuccess) onSuccess(res.role);
    } else {
      // Phone sign-in
      const res = mode === 'signin'
        ? await loginSubscriber(identifier, password)
        : await registerSubscriber(identifier, password, signupFirstName.trim(), signupLastName.trim());
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      onClose();
      if (onSuccess) onSuccess('owner');
    }
  };

  // ─── SIGN UP STEP 2: Verify OTP then create account ────────────────────
  const handleSignupVerifyAndCreate = async () => {
    setError('');
    const otpVal = signupOtpDigits.join('');
    if (otpVal.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }

    setLoading(true);
    const verifyRes = await verifySubscriberRegOtp(identifier, otpVal);
    if (verifyRes.error) { setLoading(false); setError(verifyRes.error); return; }

    const res = await registerSubscriber(identifier, password, signupFirstName.trim(), signupLastName.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onClose();
    if (onSuccess) onSuccess('owner');
  };

  // ─── FORGOT PASSWORD STEP 1: Send OTP ──────────────────────────────────
  const handleSendOtp = async () => {
    setError('');
    const idError = validateIdentifier(forgotIdentifier);
    if (idError) { setError(idError); return; }

    setLoading(true);

    if (isEmail(forgotIdentifier)) {
      const { error } = await (await import('@/app/lib/supabase')).supabase.auth.resetPasswordForEmail(forgotIdentifier);
      setLoading(false);
      if (error) { setError(error.message); return; }
      setResetEmailSent(true);
      return;
    }

    const res = await sendSubscriberOtp(forgotIdentifier);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setDevOtp(res.otp);
    startCountdown();
    setForgotStep(2);
  };

  // ─── FORGOT PASSWORD STEP 2: Verify OTP ────────────────────────────────
  const handleVerifyOtp = () => {
    setError('');
    if (otpDigits.join('').length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }
    setForgotStep(3);
  };

  // ─── FORGOT PASSWORD STEP 3: Reset Password ────────────────────────────
  const handleResetPassword = async () => {
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    if (isEmail(forgotIdentifier)) {
      const res = await verifyAuthOtpAndReset(forgotIdentifier, otpDigits.join(''), newPassword);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
    } else {
      const res = await verifySubscriberOtpAndReset(forgotIdentifier, otpDigits.join(''), newPassword);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
    }
    setForgotSuccess(true);
  };

  // ─── OTP digit handlers ────────────────────────────────────────────────
  const handleOtpChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<(TextInput | null)[]>, index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => { next[i] = d; });
      setter(next);
      refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '');
    setter((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (digits: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<(TextInput | null)[]>, index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const signupOtpRefs = useRef<(TextInput | null)[]>([]);

  const renderOtpInputs = (
    digits: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(TextInput | null)[]>,
  ) => (
    <View style={styles.otpRow}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
          value={digit}
          onChangeText={(v) => handleOtpChange(setter, refs, i, v)}
          onKeyPress={(e) => handleOtpKeyDown(digits, setter, refs, i, e)}
          onFocus={(e) => (e.target as any)?.select?.()}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          selectTextOnFocus
        />
      ))}
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {/* Close button */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.charcoal} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.logo}><Ionicons name="home" size={28} color="#fff" /></View>
              <Text style={styles.brand}><Text style={{ color: colors.charcoal }}>RENT</Text><Text style={{ color: colors.primary }}>ZIMBABWE</Text></Text>

              {/* ═══════════════════════════════════════════════
                  SIGN IN / SIGN UP — STEP 1
              ═══════════════════════════════════════════════ */}
              {(mode === 'signin' || mode === 'signup') && signupStep === 1 && (
                <>
                  <Text style={styles.tagline}>
                    {signupSuccessMsg ? 'Check your email' : mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </Text>

                  {signupSuccessMsg ? (
                    <View style={styles.successBox}>
                      <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
                      <Text style={styles.successTitle}>Verify Your Email</Text>
                      <Text style={styles.successSub}>{signupSuccessMsg}</Text>
                      <TouchableOpacity style={styles.btn} onPress={onClose}>
                        <Text style={styles.btnTxt}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {/* Name fields (signup only) */}
                      {mode === 'signup' && (
                        <View style={styles.nameRow}>
                          <View style={[styles.inputWrap, { flex: 1 }]}>
                            <Ionicons name="person-outline" size={18} color={colors.gray} />
                            <TextInput
                              style={styles.input}
                              placeholder="First name"
                              placeholderTextColor={colors.lightGray}
                              value={signupFirstName}
                              onChangeText={setSignupFirstName}
                            />
                          </View>
                          <View style={[styles.inputWrap, { flex: 1 }]}>
                            <Ionicons name="person-outline" size={18} color={colors.gray} />
                            <TextInput
                              style={styles.input}
                              placeholder="Last name"
                              placeholderTextColor={colors.lightGray}
                              value={signupLastName}
                              onChangeText={setSignupLastName}
                            />
                          </View>
                        </View>
                      )}

                      {/* Identifier */}
                      <Text style={styles.label}>Email or phone number</Text>
                      <View style={styles.inputWrap}>
                        <Ionicons
                          name={isEmail(identifier) ? 'mail-outline' : identifier.trim().length > 0 ? 'call-outline' : 'at-outline'}
                          size={18}
                          color={colors.gray}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="email@example.com or 077 123 4567"
                          placeholderTextColor={colors.lightGray}
                          value={identifier}
                          onChangeText={setIdentifier}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>

                      {/* Password */}
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={18} color={colors.gray} />
                        <TextInput
                          style={styles.input}
                          placeholder="Enter password"
                          placeholderTextColor={colors.lightGray}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray} />
                        </TouchableOpacity>
                      </View>

                      {/* Confirm password (signup) */}
                      {mode === 'signup' && (
                        <>
                          <Text style={styles.label}>Confirm password</Text>
                          <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={colors.gray} />
                            <TextInput
                              style={styles.input}
                              placeholder="Confirm password"
                              placeholderTextColor={colors.lightGray}
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry={!showPassword}
                            />
                          </View>
                        </>
                      )}

                      {/* Forgot password link */}
                      {mode === 'signin' && (
                        <TouchableOpacity onPress={() => switchMode('forgot')} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                          <Text style={styles.forgotLink}>Forgot password?</Text>
                        </TouchableOpacity>
                      )}

                      {error ? <Text style={styles.error}>{error}</Text> : null}

                      <TouchableOpacity style={styles.btn} onPress={handleAuthSubmit} disabled={loading} activeOpacity={0.88}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>}
                      </TouchableOpacity>

                      <Text style={styles.switchMode}>
                        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                        <Text style={styles.switchLink} onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                          {mode === 'signin' ? 'Sign up for free' : 'Sign in instead'}
                        </Text>
                      </Text>
                    </>
                  )}
                </>
              )}

              {/* ═══════════════════════════════════════════════
                  SIGN UP — STEP 2: Verify phone OTP
              ═══════════════════════════════════════════════ */}
              {mode === 'signup' && signupStep === 2 && (
                <>
                  <TouchableOpacity onPress={() => { setSignupStep(1); setSignupOtpDigits(Array(OTP_LENGTH).fill('')); setError(''); }} style={styles.backLink}>
                    <Ionicons name="arrow-back" size={16} color={colors.gray} />
                    <Text style={styles.backTxt}>Back</Text>
                  </TouchableOpacity>

                  <View style={styles.otpHeader}>
                    <View style={styles.otpIcon}><Ionicons name="shield-checkmark" size={28} color={colors.primary} /></View>
                    <Text style={styles.otpTitle}>Verify your number</Text>
                    <Text style={styles.otpSub}>A 6-digit code was sent via SMS to {identifier}</Text>
                  </View>

                  {signupDevOtp && (
                    <View style={styles.devBanner}>
                      <Text style={styles.devLabel}>Dev Mode — OTP</Text>
                      <Text style={styles.devCode}>{signupDevOtp}</Text>
                    </View>
                  )}

                  {renderOtpInputs(signupOtpDigits, setSignupOtpDigits, signupOtpRefs)}

                  <View style={styles.countdownRow}>
                    {signupCountdown > 0 ? (
                      <Text style={styles.countdownTxt}>Resend code in 0:{signupCountdown.toString().padStart(2, '0')}</Text>
                    ) : (
                      <TouchableOpacity onPress={async () => {
                        setLoading(true);
                        const res = await sendSubscriberRegOtp(identifier);
                        setLoading(false);
                        if (res.error) { setError(res.error); return; }
                        setSignupDevOtp(res.otp);
                        setSignupOtpDigits(Array(OTP_LENGTH).fill(''));
                        startSignupCountdown();
                      }} disabled={loading}>
                        <Text style={styles.resendLink}>Resend code</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.btn, signupOtpDigits.join('').length < OTP_LENGTH && { opacity: 0.5 }]}
                    onPress={handleSignupVerifyAndCreate}
                    disabled={loading || signupOtpDigits.join('').length < OTP_LENGTH}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Verify & Create Account</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* ═══════════════════════════════════════════════
                  FORGOT PASSWORD FLOW
              ═══════════════════════════════════════════════ */}
              {mode === 'forgot' && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      if (forgotStep === 1) switchMode('signin');
                      else if (forgotStep === 2) { setForgotStep(1); setOtpDigits(Array(OTP_LENGTH).fill('')); setError(''); }
                      else { setForgotStep(2); setError(''); }
                    }}
                    style={styles.backLink}
                  >
                    <Ionicons name="arrow-back" size={16} color={colors.gray} />
                    <Text style={styles.backTxt}>{forgotStep === 1 ? 'Back to sign in' : 'Back'}</Text>
                  </TouchableOpacity>

                  {resetEmailSent ? (
                    <View style={styles.successBox}>
                      <Ionicons name="mail-open-outline" size={48} color={colors.success} />
                      <Text style={styles.successTitle}>Check your email!</Text>
                      <Text style={styles.successSub}>We've sent a secure password reset link to your email address.</Text>
                      <TouchableOpacity style={styles.btn} onPress={() => { clearForgotState(); switchMode('signin'); }}>
                        <Text style={styles.btnTxt}>Return to Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  ) : forgotSuccess ? (
                    <View style={styles.successBox}>
                      <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                      <Text style={styles.successTitle}>All done!</Text>
                      <Text style={styles.successSub}>Your password has been updated. Sign in with your new password.</Text>
                      <TouchableOpacity style={styles.btn} onPress={() => { clearForgotState(); switchMode('signin'); }}>
                        <Text style={styles.btnTxt}>Sign In Now</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.tagline}>
                        {forgotStep === 1 ? 'Forgot Password?' : forgotStep === 2 ? 'Enter OTP' : 'New Password'}
                      </Text>

                      {/* Step 1: Enter identifier */}
                      {forgotStep === 1 && (
                        <>
                          <Text style={styles.label}>Registered email or phone number</Text>
                          <View style={styles.inputWrap}>
                            <Ionicons
                              name={isEmail(forgotIdentifier) ? 'mail-outline' : 'call-outline'}
                              size={18}
                              color={colors.gray}
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="email@example.com or 077 123 4567"
                              placeholderTextColor={colors.lightGray}
                              value={forgotIdentifier}
                              onChangeText={setForgotIdentifier}
                              autoCapitalize="none"
                            />
                          </View>

                          {error ? <Text style={styles.error}>{error}</Text> : null}

                          <TouchableOpacity style={styles.btn} onPress={handleSendOtp} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Send Recovery Code</Text>}
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Step 2: Enter OTP */}
                      {forgotStep === 2 && (
                        <>
                          {devOtp && (
                            <View style={styles.devBanner}>
                              <Text style={styles.devLabel}>Dev Mode — OTP</Text>
                              <Text style={styles.devCode}>{devOtp}</Text>
                            </View>
                          )}

                          <Text style={styles.label}>Enter your 6-digit code</Text>
                          {renderOtpInputs(otpDigits, setOtpDigits, otpRefs)}

                          <View style={styles.countdownRow}>
                            {countdown > 0 ? (
                              <Text style={styles.countdownTxt}>Resend code in 0:{countdown.toString().padStart(2, '0')}</Text>
                            ) : (
                              <TouchableOpacity onPress={async () => {
                                setLoading(true);
                                const res = await sendSubscriberOtp(forgotIdentifier);
                                setLoading(false);
                                if (res.error) { setError(res.error); return; }
                                setDevOtp(res.otp);
                                setOtpDigits(Array(OTP_LENGTH).fill(''));
                                startCountdown();
                              }} disabled={loading}>
                                <Text style={styles.resendLink}>Resend code</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {error ? <Text style={styles.error}>{error}</Text> : null}

                          <TouchableOpacity
                            style={[styles.btn, otpDigits.join('').length < OTP_LENGTH && { opacity: 0.5 }]}
                            onPress={handleVerifyOtp}
                            disabled={otpDigits.join('').length < OTP_LENGTH}
                          >
                            <Text style={styles.btnTxt}>Verify Code</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Step 3: New password */}
                      {forgotStep === 3 && (
                        <>
                          <Text style={styles.label}>New password</Text>
                          <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={colors.gray} />
                            <TextInput
                              style={styles.input}
                              placeholder="Enter new password"
                              placeholderTextColor={colors.lightGray}
                              value={newPassword}
                              onChangeText={setNewPassword}
                              secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                              <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray} />
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.label}>Confirm new password</Text>
                          <View style={styles.inputWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={colors.gray} />
                            <TextInput
                              style={styles.input}
                              placeholder="Confirm new password"
                              placeholderTextColor={colors.lightGray}
                              value={confirmNewPassword}
                              onChangeText={setConfirmNewPassword}
                              secureTextEntry={!showNewPassword}
                            />
                          </View>

                          {error ? <Text style={styles.error}>{error}</Text> : null}

                          <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Reset Password</Text>}
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              <Text style={styles.terms}>By continuing you agree to our Terms & Privacy Policy</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,30,45,0.6)' },
  safe: { flex: 1 },
  scroll: { padding: 24, paddingTop: 10, backgroundColor: colors.white, minHeight: '100%' },
  closeBtn: { alignSelf: 'flex-end', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 10, ...shadow },
  brand: { fontSize: 26, fontWeight: '800', color: colors.charcoal, textAlign: 'center', marginTop: 14 },
  tagline: { fontSize: 15, color: colors.gray, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.charcoal, marginTop: 14, marginBottom: 8 },

  nameRow: { flexDirection: 'row', gap: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, height: 54, marginTop: 4 },
  input: { flex: 1, fontSize: 15, color: colors.charcoal },
  forgotLink: { fontSize: 13, fontWeight: '700', color: colors.primary },
  error: { color: '#E53E3E', fontSize: 13, marginTop: 12, textAlign: 'center' },
  btn: { backgroundColor: colors.coral, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchMode: { textAlign: 'center', fontSize: 14, color: colors.gray, marginTop: 18 },
  switchLink: { fontWeight: '700', color: colors.primary },
  terms: { fontSize: 12, color: colors.lightGray, textAlign: 'center', marginTop: 24, lineHeight: 18 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backTxt: { fontSize: 14, fontWeight: '600', color: colors.gray },
  otpHeader: { alignItems: 'center', marginBottom: 24 },
  otpIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.seafoam, alignItems: 'center', justifyContent: 'center' },
  otpTitle: { fontSize: 20, fontWeight: '800', color: colors.charcoal, marginTop: 12 },
  otpSub: { fontSize: 14, color: colors.gray, marginTop: 4, textAlign: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  otpInput: { width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: '800', borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, backgroundColor: '#F7FAFC', color: colors.charcoal },
  otpInputFilled: { borderColor: colors.primary, backgroundColor: '#EBF8FF', color: colors.primary },
  countdownRow: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  countdownTxt: { fontSize: 14, color: colors.gray },
  resendLink: { fontSize: 14, fontWeight: '700', color: colors.primary },
  devBanner: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, borderRadius: radius.md, padding: 12, alignItems: 'center', marginBottom: 16 },
  devLabel: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  devCode: { fontSize: 24, fontFamily: 'monospace', fontWeight: '900', color: '#92400E', letterSpacing: 4, marginTop: 4 },
  successBox: { alignItems: 'center', paddingVertical: 30 },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.charcoal, marginTop: 14 },
  successSub: { fontSize: 14, color: colors.gray, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  otpSubText: { fontSize: 13, fontWeight: '700', color: colors.charcoal, marginBottom: 8 },
});
