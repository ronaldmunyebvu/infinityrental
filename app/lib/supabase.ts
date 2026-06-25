import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://gmiytvwmhzffnxvexjtx.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZmOGM5M2ZiLTAzZGMtNDA0OC1iMGFjLTM4NTBhYmY2YjE5MiJ9.eyJwcm9qZWN0SWQiOiJnbWl5dHZ3bWh6ZmZueHZleGp0eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgyMjg3Mjg5LCJleHAiOjIwOTc2NDcyODksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.jG9cseF_jG3c9SFFafEus4wrBIt30urIH_0Ho8U8y-k';
// Provide a WebSocket transport so realtime-js doesn't crash on Node 20 during build
const WS: any =
  typeof globalThis !== 'undefined' && (globalThis as any).WebSocket
    ? (globalThis as any).WebSocket
    : class {
        constructor() {}
        close() {}
        send() {}
        addEventListener() {}
        removeEventListener() {}
      };

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WS, params: { eventsPerSecond: 1 } },
  auth: { persistSession: true, autoRefreshToken: true },
});


export { supabase };