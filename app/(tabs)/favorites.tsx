import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "../../src/hooks/useAppTheme";
import { supabase } from "../../src/lib/supabase";
import { fetchFavoriteQuoteIds } from "../../src/services/favorites";
import { Quote } from "../../src/types/quote";

export default function FavoritesScreen() {
  const { ui, reloadTheme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const ids = await fetchFavoriteQuoteIds();
      if (ids.length === 0) {
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
    loadFavorites();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: ui.sub }}>Loading favorites...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ui.bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: ui.text, fontSize: ui.fontSize + 8 }]}>
          Favorites
        </Text>

        <View style={[styles.badge, { backgroundColor: ui.isDark ? "#2A1212" : "#FEE2E2" }]}>
          <Ionicons name="heart" size={14} color="#EF4444" />
          <Text style={[styles.badgeText, { color: ui.text }]}>{quotes.length}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: ui.sub, fontSize: ui.fontSize - 2 }]}>
        Your saved quotes, synced with cloud ☁️
      </Text>

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}>
            <Text style={[styles.quote, { color: ui.text, fontSize: ui.fontSize }]}>
              "{item.quote}"
            </Text>

            <View style={styles.footerRow}>
              <Text style={[styles.author, { color: ui.sub, fontSize: ui.fontSize - 2 }]}>
                — {item.author ?? "Unknown"}
              </Text>

              <Text
                style={[
                  styles.category,
                  {
                    backgroundColor: ui.border,
                    color: ui.text,
                    fontSize: ui.fontSize - 4,
                  },
                ]}
              >
                {item.category ?? "General"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={34} color={ui.sub} />
            <Text style={[styles.emptyTitle, { color: ui.text }]}>No favorites yet</Text>
            <Text style={[styles.emptyText, { color: ui.sub }]}>
              Tap the ❤️ icon on Home to save quotes.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: { fontWeight: "800", flex: 1, marginRight: 10 },

  category: {
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },

  empty: { alignItems: "center", padding: 36, marginTop: 40 },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "900" },
  emptyText: { marginTop: 8, textAlign: "center", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
