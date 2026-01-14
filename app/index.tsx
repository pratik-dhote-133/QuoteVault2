import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabase";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
      }

      setLoading(false);
    };

    run();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/(tabs)/home");
      else router.replace("/(auth)/login");
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) return null;

  return null;
}
