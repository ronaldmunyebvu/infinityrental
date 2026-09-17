import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, deletePropertyImages } from '@/app/lib/supabase';

function isEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@infinity.local`;
}

type AuthCtx = {
  user: any | null;
  loading: boolean;
  signUp: (identifier: string, password: string, role: 'owner' | 'seeker', firstName?: string, lastName?: string) => Promise<{ error?: string; role?: string; needsEmailVerification?: boolean }>;
  signIn: (identifier: string, password: string) => Promise<{ error?: string; role?: string; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  sendAuthOtp: (identifier: string) => Promise<{ error?: string; otp?: string }>;
  verifyAuthOtpAndReset: (identifier: string, otp: string, newPassword: string) => Promise<{ error?: string }>;
  sendOwnerRegOtp: (identifier: string) => Promise<{ error?: string; otp?: string }>;
  verifyOwnerRegOtp: (identifier: string, otp: string) => Promise<{ error?: string }>;
};

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async (
    identifier: string,
    password: string,
    role: 'owner' | 'seeker',
    firstName?: string,
    lastName?: string,
  ) => {
    const email = isEmail(identifier) ? identifier.trim().toLowerCase() : phoneToEmail(identifier);
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error) return { error: error.message };

    const authUser = authData.user;
    if (authUser) {
      const { error: profileError } = await supabase.from('users').insert({
        id: authUser.id,
        role,
        phone_number: isEmail(identifier) ? null : identifier,
        email: isEmail(identifier) ? identifier.trim().toLowerCase() : null,
      });
      if (profileError) console.error('Failed to create profile record:', profileError);
    }

    // Auto sign-in if email confirmation is disabled
    if (!(await supabase.auth.getSession()).data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        if (signInErr.message.toLowerCase().includes('email not confirmed')) {
          return { needsEmailVerification: true };
        }
        return { error: 'Account created. Please sign in.' };
      }
    }
    return { role };
  };

  const signIn = async (identifier: string, password: string) => {
    const email = isEmail(identifier) ? identifier.trim().toLowerCase() : phoneToEmail(identifier);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
      if (profile) return { role: profile.role };
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'No user logged in.' };
    const userIdentifier = user.email || user.phone || user.id;

    try {
      // 1. Fetch user's property listings to collect image URLs
      const { data: userProps } = await supabase
        .from('properties')
        .select('images, image_url, id')
        .or(`user_id.eq.${user.id},email_number.eq.${userIdentifier},contact_phone.eq.${userIdentifier},contact_email.eq.${userIdentifier}`);

      if (userProps && userProps.length > 0) {
        const allUrls: string[] = [];
        for (const p of userProps) {
          if (Array.isArray(p.images)) allUrls.push(...p.images);
          if (typeof p.image_url === 'string' && p.image_url) allUrls.push(p.image_url);
        }

        // 2. Delete all image files from Supabase Storage bucket
        if (allUrls.length > 0) {
          await deletePropertyImages(allUrls).catch((e) => console.warn('Warning deleting storage images:', e));
        }

        // 3. Delete property listings from database
        await supabase
          .from('properties')
          .delete()
          .or(`user_id.eq.${user.id},email_number.eq.${userIdentifier},contact_phone.eq.${userIdentifier},contact_email.eq.${userIdentifier}`);
      }

      // 4. Delete user profile record
      const { error: dbErr } = await supabase.from('users').delete().eq('id', user.id);
      if (dbErr) console.warn('Warning deleting user profile record:', dbErr.message);

      // 5. Sign out user
      await supabase.auth.signOut();
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to delete account.' };
    }
  };

  const sendAuthOtp = async (identifier: string): Promise<{ error?: string; otp?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { identifier: identifier.trim(), userType: 'owner' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return { otp: data?.otp };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to send OTP.' };
    }
  };

  const verifyAuthOtpAndReset = async (
    identifier: string,
    otp: string,
    newPassword: string,
  ): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { identifier: identifier.trim(), otp, newPassword, userType: 'owner' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to reset password.' };
    }
  };

  const sendOwnerRegOtp = async (identifier: string): Promise<{ error?: string; otp?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { identifier: identifier.trim(), userType: 'owner', purpose: 'registration' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return { otp: data?.otp };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to send OTP.' };
    }
  };

  const verifyOwnerRegOtp = async (identifier: string, otp: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { identifier: identifier.trim(), otp, userType: 'owner', purpose: 'registration' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to verify OTP.' };
    }
  };

  return (
    <Ctx.Provider value={{
      user, loading, signUp, signIn, signOut, deleteAccount,
      sendAuthOtp, verifyAuthOtpAndReset,
      sendOwnerRegOtp, verifyOwnerRegOtp,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
