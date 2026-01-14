import { supabase } from "../lib/supabase";

export async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchFavoriteQuoteIds() {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_favorites")
    .select("quote_id")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((x) => x.quote_id as number);
}

export async function addFavorite(quoteId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("user_favorites")
    .insert([{ user_id: userId, quote_id: quoteId }]);

  if (error) throw error;
}

export async function removeFavorite(quoteId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("quote_id", quoteId);

  if (error) throw error;
}
