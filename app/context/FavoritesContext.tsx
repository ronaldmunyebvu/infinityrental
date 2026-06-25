import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';

type FavCtx = {
  ids: Set<string>;
  isFav: (id: string) => boolean;
  toggleFav: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  count: number;
};

const Ctx = createContext<FavCtx>({} as FavCtx);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    const { data } = await supabase.from('favourites').select('property_id').eq('user_id', user.id);
    setIds(new Set((data || []).map((d: any) => d.property_id)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isFav = useCallback((id: string) => ids.has(id), [ids]);

  const toggleFav = useCallback(async (id: string) => {
    if (!user) return false;
    const has = ids.has(id);
    setIds((prev) => {
      const next = new Set(prev);
      has ? next.delete(id) : next.add(id);
      return next;
    });
    if (has) {
      await supabase.from('favourites').delete().eq('user_id', user.id).eq('property_id', id);
    } else {
      await supabase.from('favourites').upsert({ user_id: user.id, property_id: id }, { onConflict: 'user_id,property_id' });
    }
    return true;
  }, [ids, user]);

  return (
    <Ctx.Provider value={{ ids, isFav, toggleFav, refresh, count: ids.size }}>
      {children}
    </Ctx.Provider>
  );
}

export const useFavorites = () => useContext(Ctx);
