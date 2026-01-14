import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../../src/hooks/useAppTheme";
import { supabase } from "../../src/lib/supabase";
import { fetchCollectionQuoteIds, removeQuoteFromCollection } from "../../src/services/collections";
import { Quote } from "../../src/types/quote";

export default function CollectionDetail() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const { ui, reloadTheme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const count = useMemo(() => quotes.length, [quotes]);

  const load = async () => {
    setLoading(true);
    try {
      const ids = await fetchCollectionQuoteIds(id);

      if (!ids || ids.length === 0) {
        setQuotes([]);
        return;
      }

      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .in("id", ids)
        .order("id", { ascending: false });

      if (error) throw error;
      setQuotes((data ?? []) as Quote[]);
    } catch (e) {
      console.log(e);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTheme();
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const removeQuote = async (quoteId: number) => {
    try {
      await removeQuoteFromCollection(id, quoteId);
      await load();
    } catch (e) {
      console.log("removeQuote error", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: ui.sub }}>Loading quotes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ui.bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: ui.border }]}
        >
          <Ionicons name="chevron-back" size={22} color={ui.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={[styles.title, { color: ui.text, fontSize: ui.fontSize + 3 }]}
            numberOfLines={1}
          >
            {name ?? "Collection"}
          </Text>
          <Text style={[styles.subtitle, { color: ui.sub, fontSize: ui.fontSize - 2 }]}>
            Saved quotes in this collection
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: ui.border }]}>
          <Ionicons name="document-text" size={14} color={ui.text} />
          <Text style={[styles.badgeText, { color: ui.text }]}>{count}</Text>
        </View>
      </View>

      <FlatList
        data={quotes}
        keyExtractor={(q) => q.id.toString()}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}>
            <Text style={[styles.quote, { color: ui.text, fontSize: ui.fontSize }]}>
              "{item.quote}"
            </Text>

            <View style={styles.footerRow}>
              <Text
                style={[
                  styles.author,
                  { color: ui.sub, fontSize: ui.fontSize - 2 },
                ]}
              >
                — {item.author ?? "Unknown"}
              </Text>

              <TouchableOpacity
                onPress={() => removeQuote(item.id)}
                style={[
                  styles.removeBtn,
                  { backgroundColor: ui.isDark ? "#2A1212" : "#FEE2E2" },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.removeText, { fontSize: ui.fontSize - 2 }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.categoryTag,
                { backgroundColor: ui.border, color: ui.text, fontSize: ui.fontSize - 3 },
              ]}
            >
              {item.category ?? "General"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={34} color={ui.sub} />
            <Text style={[styles.emptyTitle, { color: ui.text }]}>
              No quotes in this collection
            </Text>
            <Text style={[styles.emptyText, { color: ui.sub }]}>
              Add quotes from Home → Collection option ✅
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  title: { fontWeight: "900" },
  subtitle: { marginTop: 4, fontWeight: "700" },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontWeight: "900" },

  card: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },

  quote: { fontWeight: "900", lineHeight: 24 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
  },
  author: { fontWeight: "800", flex: 1, marginRight: 10 },

  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  removeText: { color: "#EF4444", fontWeight: "900" },

  categoryTag: {
    marginTop: 12,
    alignSelf: "flex-start",
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },

  emptyWrap: { alignItems: "center", padding: 36, marginTop: 50 },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "900" },
  emptyText: { marginTop: 8, textAlign: "center", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
