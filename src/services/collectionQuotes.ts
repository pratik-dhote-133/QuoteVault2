import { supabase } from "../lib/supabase";

/**
 * Add a quote to a collection (insert into collection_quotes table)
 */
export async function addQuoteToCollection(
  collectionId: string,
  quoteId: number
) {
  const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Not logged in");

await supabase.from("collection_quotes").insert({
  collection_id: collectionId,
  quote_id: quoteId,
  user_id: user.id,   // ✅ ADD THIS LINE
});

}

/**
 * Remove a quote from a collection
 */
export async function removeQuoteFromCollection(
  collectionId: string,
  quoteId: number
) {
  const { error } = await supabase
    .from("collection_quotes")
    .delete()
    .eq("collection_id", collectionId)
    .eq("quote_id", quoteId);

  if (error) throw error;
}

/**
 * Fetch all quotes of a collection (join with quotes table)
 */
export async function fetchCollectionQuotes(collectionId: string) {
  const { data, error } = await supabase
    .from("collection_quotes")
    .select("quote_id, quotes(*)")
    .eq("collection_id", collectionId);

  if (error) throw error;

  // Return quotes array only
  return (data || []).map((row: any) => row.quotes);
}
