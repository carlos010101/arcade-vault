'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type SessionUser = { id: string; name: string } | null;

type SessionContextValue = {
  user: SessionUser;
  loading: boolean;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function toSessionUser(user: User | null): SessionUser {
  if (!user) return null;
  const name =
    user.user_metadata?.username ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    'Jugador';
  return { id: user.id, name };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(toSessionUser(data.user));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toSessionUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <SessionContext.Provider value={{ user, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
