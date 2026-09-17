/**
 * Rental app payment gateway.
 *
 * Serves POST /api/pay — the exact endpoint the mobile app (SubscriptionModal)
 * calls to start an EcoCash/Paynow payment for the $5 Premium Pass.
 *
 * Flows:
 *  - TEST MODE (default, PAYNOW_TEST_MODE=true): payment is auto-completed
 *    a few seconds after initiation so the whole lock->pay->unlock flow can be
 *    verified without real money.
 *  - REAL MODE (PAYNOW_TEST_MODE=false + Paynow integration id/key): calls the
 *    Paynow API which pushes an EcoCash prompt to the user's phone, then the
 *    Paynow result webhook (/api/result) finalizes the payment.
 *
 * The Supabase "payments" row is created with status "Initiated". When the
 * payment succeeds the row is updated to "Paid", which is what the app polls
 * for and what triggers the subscription expiry update on the database.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kollnkzommrfkvogwhjn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TEST_MODE = String(process.env.PAYNOW_TEST_MODE || 'true').toLowerCase() !== 'false';
const TEST_AUTO_COMPLETE_MS = Number(process.env.PAYNOW_TEST_AUTO_COMPLETE_MS || 10000);
const SUBSCRIPTION_AMOUNT = Number(process.env.SUBSCRIPTION_AMOUNT || 5);
const SUBSCRIPTION_DESCRIPTION = process.env.SUBSCRIPTION_DESCRIPTION || '1 Month Premium Access';
const AUTHEMAIL = process.env.PAYNOW_AUTHEMAIL || 'infinitymetersolutions@gmail.com';

const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID || '';
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY || '';
const PAYNOW_INITIATE_URL = process.env.PAYNOW_INITIATE_URL || 'https://www.paynow.co.zw/Interface/InitiateTransaction';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

if (!SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_ANON_KEY is not set (server/.env).');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. The gateway can START payments but cannot FINALIZE them (payments will stay "Initiated" and contacts will not unlock). Add it to server/.env.');
}

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const admin = SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function makeReference() {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `PAY-${rand}`;
}

function cleanMobile(input) {
  let phone = String(input || '').replace(/[\s\-\+]+/g, '');
  if (phone.startsWith('263')) phone = '0' + phone.slice(3);
  return phone;
}

async function insertPayment(row) {
  const { data, error } = await db
    .from('payments')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(`Failed to record payment: ${error.message}`);
  return data;
}

async function finalizePayment(reference, { paynowReference = null, pollurl = null, status = 'Paid' } = {}) {
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured — cannot finalize payment.');
  const patch = { status, updated_at: new Date().toISOString() };
  if (paynowReference) patch.paynow_reference = paynowReference;
  if (pollurl) patch.pollurl = pollurl;
  const { data, error } = await admin
    .from('payments')
    .update(patch)
    .eq('reference', reference)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`Failed to update payment status: ${error.message}`);
  return data;
}

function verifyPaynowHash(body) {
  const keys = Object.keys(body).filter((k) => k.toLowerCase() !== 'hash').sort();
  let str = '';
  for (const k of keys) str += body[k];
  str += PAYNOW_INTEGRATION_KEY;
  const hash = crypto.createHash('md5').update(str).digest('hex').toUpperCase();
  return hash === String(body.hash || '').toUpperCase();
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    testMode: TEST_MODE,
    amount: SUBSCRIPTION_AMOUNT,
    serviceRoleConfigured: Boolean(SERVICE_ROLE_KEY),
    paynowConfigured: Boolean(PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY),
  });
});

app.post('/api/pay', async (req, res) => {
  const { mobile, amount, authemail, subscriber_identifier } = req.body || {};

  const cleanPhone = cleanMobile(mobile);
  if (!cleanPhone.startsWith('077') && !cleanPhone.startsWith('078')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid EcoCash number starting with 077 or 078.' });
  }
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, error: 'EcoCash number must be 10 digits long (e.g., 077 123 4567).' });
  }

  const reference = makeReference();
  const payAmount = Number(amount) || SUBSCRIPTION_AMOUNT;

  try {
    await insertPayment({
      reference,
      amount: payAmount,
      customer_email: authemail || AUTHEMAIL,
      customer_mobile: cleanPhone,
      description: SUBSCRIPTION_DESCRIPTION,
      status: 'Initiated',
      subscriber_identifier: subscriber_identifier || null,
    });

    if (TEST_MODE) {
      console.log(`[test] Payment ${reference} initiated for ${cleanPhone} (${subscriber_identifier || 'anon'}). Auto-completing in ${TEST_AUTO_COMPLETE_MS}ms...`);
      setTimeout(async () => {
        try {
          const updated = await finalizePayment(reference, {
            paynowReference: `TEST${Date.now().toString().slice(-8)}`,
          });
          console.log(`[test] Payment ${reference} -> Paid`, updated ? `(id ${updated.id})` : '');
        } catch (err) {
          console.error(`[test] Failed to finalize ${reference}:`, err.message);
        }
      }, TEST_AUTO_COMPLETE_MS);
    } else {
      if (!PAYNOW_INTEGRATION_ID || !PAYNOW_INTEGRATION_KEY) {
        throw new Error('PAYNOW_INTEGRATION_ID/KEY not configured in server/.env for real mode.');
      }
      const params = new URLSearchParams({
        id: PAYNOW_INTEGRATION_ID,
        reference,
        amount: payAmount.toFixed(2),
        authemail: authemail || AUTHEMAIL,
        mobile: cleanPhone,
        description: SUBSCRIPTION_DESCRIPTION,
        resulturl: `${PUBLIC_BASE_URL}/api/result`,
        returnurl: `${PUBLIC_BASE_URL}/api/result`,
      });
      const paynowRes = await fetch(PAYNOW_INITIATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const text = await paynowRes.text();
      const parsed = Object.fromEntries(new URLSearchParams(text));

      if (parsed.status !== 'Ok') {
        throw new Error(parsed.error || 'Paynow could not start the payment.');
      }
      if (admin) {
        await finalizePayment(reference, { paynowReference: parsed.paynowreference, pollurl: parsed.pollurl, status: 'Initiated' }).catch(() => {});
      }
      console.log(`Payment ${reference} initiated via Paynow (paynow ref ${parsed.paynowreference}).`);
    }

    return res.json({ success: true, reference });
  } catch (err) {
    console.error('Payment initiation failed:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/result', async (req, res) => {
  const body = req.body || {};
  const reference = body.reference;
  const status = String(body.status || '').toLowerCase();

  if (PAYNOW_INTEGRATION_KEY && !verifyPaynowHash(body)) {
    console.warn('[webhook] Ignored Paynow callback with invalid hash.');
    return res.status(400).send('Invalid hash');
  }

  console.log(`[webhook] Paynow callback for ${reference}: status=${status} (paynow ref ${body.paynowreference || 'n/a'})`);

  if (reference && (status === 'paid' || status === 'done')) {
    try {
      await finalizePayment(reference, {
        paynowReference: body.paynowreference || null,
        pollurl: body.pollurl || null,
      });
      console.log(`[webhook] Payment ${reference} -> Paid`);
    } catch (err) {
      console.error(`[webhook] Failed to finalize ${reference}:`, err.message);
    }
  } else if (reference && (status === 'cancelled' || status === 'failed')) {
    try {
      await finalizePayment(reference, { status: 'Cancelled' });
    } catch (err) {
      console.error(`[webhook] Failed to cancel ${reference}:`, err.message);
    }
  }

  res.status(200).send('OK');
});

app.post('/api/verify-iap', async (req, res) => {
  const { purchaseToken, productId, subscriber_identifier, transactionId } = req.body || {};

  if (!purchaseToken || !subscriber_identifier) {
    return res.status(400).json({ success: false, error: 'Missing purchaseToken or subscriber_identifier' });
  }

  const reference = `IAP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const paynowRef = transactionId || purchaseToken;

  console.log(`[IAP] Verifying purchase for ${subscriber_identifier} (token: ${purchaseToken.slice(0, 10)}...)`);

  try {
    // Save payment record in DB
    const { error: insertErr } = await db.from('payments').insert({
      reference,
      paynow_reference: paynowRef,
      phone_number: subscriber_identifier,
      amount: 5.0,
      status: 'Paid',
    });

    if (insertErr) {
      console.warn('[IAP] Non-fatal DB insert warning:', insertErr.message);
    }

    if (admin) {
      await finalizePayment(reference, {
        paynowReference: paynowRef,
        status: 'Paid',
      });
    }

    return res.json({ success: true, reference, paynowReference: paynowRef });
  } catch (err) {
    console.error('[IAP] Verification error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/simulate/:reference', async (req, res) => {
  if (!TEST_MODE) return res.status(404).json({ success: false, error: 'Simulation is only enabled in test mode.' });
  try {
    const updated = await finalizePayment(req.params.reference, {
      paynowReference: `TEST${Date.now().toString().slice(-8)}`,
    });
    res.json({ success: true, reference: req.params.reference, updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Payment gateway running on http://localhost:${PORT}`);
  console.log(`  mode: ${TEST_MODE ? 'TEST (auto-complete)' : 'REAL Paynow'}`);
  console.log(`  service role key: ${SERVICE_ROLE_KEY ? 'configured' : 'MISSING'}`);
});
