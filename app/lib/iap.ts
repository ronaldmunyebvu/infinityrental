import { Platform } from 'react-native';
import { supabase } from '@/app/lib/supabase';

// Product SKU registered in Google Play Console
export const IAP_SKUS = {
  SUBSCRIPTION_1MONTH: 'infinity_premium_1month',
};

const PAYNOW_GATEWAY_URL = process.env.EXPO_PUBLIC_PAYNOW_GATEWAY_URL || 'http://localhost:3000';

let iapModule: typeof import('react-native-iap') | null = null;

try {
  if (Platform.OS !== 'web') {
    iapModule = require('react-native-iap');
  }
} catch (err) {
  console.warn('react-native-iap is not available in current environment:', err);
}

/**
 * Initialize IAP connection safely
 */
export async function initIapConnection(): Promise<boolean> {
  if (!iapModule || Platform.OS === 'web') return false;
  try {
    const result = await iapModule.initConnection();
    if (Platform.OS === 'android') {
      await iapModule.flushFailedPurchasesCachedAsPendingAndroid();
    }
    return Boolean(result);
  } catch (error) {
    console.error('Failed to initialize IAP connection:', error);
    return false;
  }
}

/**
 * End IAP Connection
 */
export async function endIapConnection(): Promise<void> {
  if (!iapModule || Platform.OS === 'web') return;
  try {
    await iapModule.endConnection();
  } catch (error) {
    console.warn('Error closing IAP connection:', error);
  }
}

/**
 * Request Google Play In-App Subscription
 */
export async function requestIapSubscription(sku: string = IAP_SKUS.SUBSCRIPTION_1MONTH): Promise<any> {
  if (!iapModule || Platform.OS === 'web') {
    throw new Error('In-App Purchasing is only supported on mobile devices.');
  }

  try {
    if (Platform.OS === 'android') {
      const subscriptions = await iapModule.getSubscriptions({ skus: [sku] });
      const sub = subscriptions.find((s) => s.productId === sku);
      const offerToken = sub?.subscriptionOfferDetails?.[0]?.offerToken;

      const purchase = await iapModule.requestSubscription({
        sku,
        ...(offerToken ? { subscriptionOffers: [{ sku, offerToken }] } : {}),
      });
      return purchase;
    } else {
      const purchase = await iapModule.requestPurchase({ sku });
      return purchase;
    }
  } catch (error: any) {
    console.error('Error requesting subscription:', error);
    throw new Error(error?.message || 'Failed to complete In-App Purchase.');
  }
}

/**
 * Verify Google Play Purchase Token with Backend Server
 */
export async function verifyIapReceipt(
  purchaseToken: string,
  productId: string,
  subscriberIdentifier: string,
  transactionId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${PAYNOW_GATEWAY_URL}/api/verify-iap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchaseToken,
        productId,
        subscriber_identifier: subscriberIdentifier,
        transactionId: transactionId || purchaseToken,
        platform: Platform.OS,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Receipt verification failed.');
    }

    if (iapModule && Platform.OS === 'android') {
      await iapModule.acknowledgePurchaseAndroid({ token: purchaseToken });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Receipt verification error:', error);
    return { success: false, error: error?.message || 'Server failed to verify purchase.' };
  }
}

/**
 * Restore Previous Active Purchases
 */
export async function restoreIapPurchases(subscriberIdentifier: string): Promise<{ restored: boolean; count: number; error?: string }> {
  if (!iapModule || Platform.OS === 'web') {
    return { restored: false, count: 0, error: 'Restoring purchases is only supported on mobile.' };
  }

  try {
    const purchases = await iapModule.getAvailablePurchases();
    if (!purchases || purchases.length === 0) {
      return { restored: false, count: 0 };
    }

    let restoredCount = 0;
    for (const purchase of purchases) {
      const token = purchase.purchaseToken;
      if (token) {
        const res = await verifyIapReceipt(token, purchase.productId, subscriberIdentifier, purchase.transactionId);
        if (res.success) restoredCount++;
      }
    }

    return { restored: restoredCount > 0, count: restoredCount };
  } catch (error: any) {
    console.error('Error restoring purchases:', error);
    return { restored: false, count: 0, error: error?.message || 'Failed to restore purchases.' };
  }
}
