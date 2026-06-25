import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from './AuthContext';

function isEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value.trim());
}

type SubscriberCtx = {
  subscriberIdentifier: string | null;
  subscriberFirstName: string | null;
  subscriberLastName: string | null;
  hasSubscription: boolean;
  loading: boolean;
  loginSubscriber: (identifier: string, password: string) => Promise<{ error?: string }>;
  registerSubscriber: (identifier: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: string }>;
  logoutSubscriber: () => void;
  refreshSubscription: (identifier?: string) => Promise<void>;
  sendSubscriberOtp: (identifier: string) => Promise<{ error?: string; otp?: string }>;
  verifySubscriberOtpAndReset: (identifier: string, otp: string, newPassword: string) => Promise<{ error?: string }>;
  sendSubscriberRegOtp: (identifier: string) => Promise<{ error?: string; otp?: string }>;
  verifySubscriberRegOtp: (identifier: string, otp: string) => Promise<{ error?: string }>;
};

const Ctx = createContext<SubscriberCtx>({} as SubscriberCtx);

export function SubscriberProvider({ children }: { children: React.ReactNode }) {
  const [subscriberIdentifier, setSubscriberIdentifier] = useState<string | null>(null);
  const [subscriberFirstName, setSubscriberFirstName] = useState<string | null>(null);
  const [subscriberLastName, setSubscriberLastName] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('subscriber_identifier');
      if (saved) {
        setSubscriberIdentifier(saved);
        setSubscriberFirstName(await AsyncStorage.getItem('subscriber_first_name'));
        setSubscriberLastName(await AsyncStorage.getItem('subscriber_last_name'));
      }
      setLoading(false);
    })();
  }, []);

  // When active identifier changes, refresh subscription status
  useEffect(() => {
    const activeIdentifier = user?.email || subscriberIdentifier;
    if (activeIdentifier) {
      refreshSubscription(activeIdentifier);
    } else {
      setHasSubscription(false);
    }
  }, [subscriberIdentifier, user]);

  const refreshSubscription = async (identifier?: string) => {
    const idToUse = identifier || user?.email || subscriberIdentifier;
    if (!idToUse) return;
    try {
      const { data, error } = await supabase.rpc('check_subscription', {
        p_phone: idToUse,
      });
      if (error) throw error;

      if (data) {
        const expiry = new Date(data).getTime();
        setHasSubscription(expiry > Date.now());
      } else {
        setHasSubscription(false);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setHasSubscription(false);
    }
  };

  const loginSubscriber = async (identifier: string, password: string) => {
    try {
      const id = identifier.trim();
      let success = false;
      let fName: string | null = null;
      let lName: string | null = null;

      if (isEmail(id)) {
        const { data, error } = await supabase.rpc('login_subscriber_by_email', {
          p_email: id.toLowerCase(),
          p_password: password,
        });
        if (error) throw error;
        if (typeof data === 'boolean') {
          success = data;
        } else if (data && data.length > 0) {
          success = data[0].success;
          fName = data[0].first_name;
          lName = data[0].last_name;
        }
      } else {
        const { data, error } = await supabase.rpc('login_subscriber', {
          p_phone: id,
          p_password: password,
        });
        if (error) throw error;
        if (typeof data === 'boolean') {
          success = data;
        } else if (data && data.length > 0) {
          success = data[0].success;
          fName = data[0].first_name;
          lName = data[0].last_name;
        }
      }

      if (success) {
        setSubscriberIdentifier(id);
        await AsyncStorage.setItem('subscriber_identifier', id);
        if (fName) {
          setSubscriberFirstName(fName);
          await AsyncStorage.setItem('subscriber_first_name', fName);
        }
        if (lName) {
          setSubscriberLastName(lName);
          await AsyncStorage.setItem('subscriber_last_name', lName);
        }
        return {};
      } else {
        return { error: 'Invalid email/phone or password.' };
      }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err) };
    }
  };

  const registerSubscriber = async (identifier: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const id = identifier.trim();
      let success = false;

      if (isEmail(id)) {
        const { data, error } = await supabase.rpc('register_subscriber_by_email', {
          p_email: id.toLowerCase(),
          p_password: password,
          p_first_name: firstName,
          p_last_name: lastName,
        });
        if (error) throw error;
        success = data === true;
        if (!success) return { error: 'Email address is already registered.' };
      } else {
        const { data, error } = await supabase.rpc('register_subscriber', {
          p_phone: id,
          p_password: password,
          p_first_name: firstName,
          p_last_name: lastName,
        });
        if (error) throw error;
        success = data === true;
        if (!success) return { error: 'Phone number is already registered.' };
      }

      const key = isEmail(id) ? id.toLowerCase() : id;
      await AsyncStorage.setItem('subscriber_identifier', key);
      setSubscriberIdentifier(key);
      if (firstName) {
        setSubscriberFirstName(firstName);
        await AsyncStorage.setItem('subscriber_first_name', firstName);
      }
      if (lastName) {
        setSubscriberLastName(lastName);
        await AsyncStorage.setItem('subscriber_last_name', lastName);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || err.details || 'An error occurred during registration.' };
    }
  };

  const logoutSubscriber = async () => {
    setSubscriberIdentifier(null);
    setSubscriberFirstName(null);
    setSubscriberLastName(null);
    setHasSubscription(false);
    await AsyncStorage.multiRemove([
      'subscriber_identifier',
      'subscriber_first_name',
      'subscriber_last_name',
    ]);
  };

  const sendSubscriberOtp = async (identifier: string): Promise<{ error?: string; otp?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { identifier: identifier.trim(), userType: 'seeker' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return { otp: data?.otp };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to send OTP.' };
    }
  };

  const verifySubscriberOtpAndReset = async (
    identifier: string,
    otp: string,
    newPassword: string,
  ): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { identifier: identifier.trim(), otp, newPassword, userType: 'seeker' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to reset password.' };
    }
  };

  const sendSubscriberRegOtp = async (identifier: string): Promise<{ error?: string; otp?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { identifier: identifier.trim(), userType: 'seeker', purpose: 'registration' },
      });
      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };
      return { otp: data?.otp };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to send OTP.' };
    }
  };

  const verifySubscriberRegOtp = async (identifier: string, otp: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { identifier: identifier.trim(), otp, userType: 'seeker', purpose: 'registration' },
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
      subscriberIdentifier, subscriberFirstName, subscriberLastName,
      hasSubscription, loading,
      loginSubscriber, registerSubscriber, logoutSubscriber,
      refreshSubscription,
      sendSubscriberOtp, verifySubscriberOtpAndReset,
      sendSubscriberRegOtp, verifySubscriberRegOtp,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSubscriber = () => useContext(Ctx);
