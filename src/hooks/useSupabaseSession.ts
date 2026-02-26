import { useEffect, useState } from "react";
import { supabase } from "@/components/atomic-crm/providers/supabase/supabase";

export function useSupabaseSession() {
  const [session, setSession] = useState<{ access_token: string } | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s ? { access_token: s.access_token } : null);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? { access_token: s.access_token } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session;
}
