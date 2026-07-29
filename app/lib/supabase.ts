import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://kollnkzommrfkvogwhjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGxua3pvbW1yZmt2b2d3aGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjUwNzIsImV4cCI6MjA5Nzg0MTA3Mn0.9HaUPlGFwayPG2B5RmZ4dH1IwxnjSOUdsVS75hgRr2k';
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


export async function uploadPropertyImage(file: { uri: string; name: string; type: string }): Promise<string | null> {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const uniqueId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${year}/${month}/${uniqueId}/${cleanFileName}`;

  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: filePath,
    type: file.type || 'image/jpeg',
  } as any);

  const { data, error } = await supabase.storage
    .from('properties')
    .upload(filePath, formData, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('properties')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deletePropertyImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    const pathMatch = url.match(/\/properties\/(.+)/);
    if (!pathMatch) continue;
    const filePath = pathMatch[1];
    const { error } = await supabase.storage
      .from('properties')
      .remove([filePath]);
    if (error) console.error('Error deleting image:', error);
  }
}

export { supabase };