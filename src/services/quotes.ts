import { supabase } from "../lib/supabase";
import { Quote } from "../types/quote";

export const CATEGORIES = ["All", "Motivation", "Love", "Success", "Wisdom", "Humor"] as const;
export type Category = (typeof CATEGORIES)[number];

type FetchQuotesParams = {
  page: number;
  pageSize: number;
  category?: Category;
  search?: string;
};

export async function fetchQuotes({ page, pageSize, category, search }: FetchQuotesParams) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("quotes")
    .select("*")
    .order("id", { ascending: false })
    .range(from, to);

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  if (search && search.trim().length > 0) {
    const s = search.trim();
    query = query.or(`quote.ilike.%${s}%,author.ilike.%${s}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Quote[];
}

export async function fetchQuoteOfTheDay(): Promise<Quote | null> {
  // local daily deterministic quote (changes daily)
  const { count, error: countErr } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true });

  if (countErr || !count) return null;

  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const index = daySeed % count;

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("id", { ascending: true })
    .range(index, index)
    .limit(1);

  if (error) return null;
  return (data?.[0] as Quote) ?? null;
}
