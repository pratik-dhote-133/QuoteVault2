import { supabase } from "../lib/supabase";
import { getUserId } from "./favorites";

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export async function fetchCollections(): Promise<Collection[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function createCollection(name: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase.from("collections").insert([{ user_id: userId, name }]);
  if (error) throw error;
}

export async function deleteCollection(collectionId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function fetchCollectionQuoteIds(collectionId: string): Promise<number[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("collection_quotes")
    .select("quote_id")
    .eq("user_id", userId)
    .eq("collection_id", collectionId);

  if (error) throw error;
  return (data ?? []).map((x) => x.quote_id as number);
}

export async function addQuoteToCollection(collectionId: string, quoteId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("collection_quotes")
    .insert([{ user_id: userId, collection_id: collectionId, quote_id: quoteId }]);

  if (error) throw error;
}

export async function removeQuoteFromCollection(collectionId: string, quoteId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("collection_quotes")
    .delete()
    .eq("user_id", userId)
    .eq("collection_id", collectionId)
    .eq("quote_id", quoteId);

  if (error) throw error;
}
