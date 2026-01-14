import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import QuoteCardGenerator from "../../src/components/QuoteCardGenerator";
import { saveImageToGallery, shareFile, shareQuoteText } from "../../src/services/shareExport";

import { addFavorite, fetchFavoriteQuoteIds, removeFavorite } from "../../src/services/favorites";
import { CATEGORIES, Category, fetchQuoteOfTheDay, fetchQuotes } from "../../src/services/quotes";
import { Quote } from "../../src/types/quote";

import { useAppTheme } from "../../src/hooks/useAppTheme";

const PAGE_SIZE = 15;

export default function HomeScreen() {
  const { ui, reloadTheme } = useAppTheme();

  const [favIds, setFavIds] = useState<number[]>([]);
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");

  const [qod, setQod] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // share/export image generator
  const [captureFn, setCaptureFn] = useState<null | (() => Promise<string>)>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const isSearching = useMemo(() => search.trim().length > 0, [search]);

  const loadQuoteOfDay = async () => {
    try {
      const data = await fetchQuoteOfTheDay();
      setQod(data);
    } catch (e) {
      console.log("qod error", e);
    }
  };

  const loadFirstPage = async () => {
    setLoading(true);
    setHasMore(true);
    setPage(0);

    try {
      const data = await fetchQuotes({
        page: 0,
        pageSize: PAGE_SIZE,
        category,
        search,
      });

      setQuotes(data);
      if (data.length < PAGE_SIZE) setHasMore(false);

      const ids = await fetchFavoriteQuoteIds();
      setFavIds(ids);
    } catch (e) {
      console.log(e);
      setQuotes([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;

      const data = await fetchQuotes({
        page: nextPage,
        pageSize: PAGE_SIZE,
        category,
        search,
      });

      setQuotes((prev) => [...prev, ...data]);
      setPage(nextPage);

      if (data.length < PAGE_SIZE) setHasMore(false);
    } catch (e) {
      console.log(e);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuoteOfDay();
    await loadFirstPage();
    setRefreshing(false);
  };

  useEffect(() => {
    reloadTheme();
    loadQuoteOfDay();
    loadFirstPage();
  }, [category, search]);

  // ✅ Share handlers
  const handleShareText = async (item: Quote) => {
    try {
      await shareQuoteText(item.quote, item.author);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Unable to share quote text.");
    }
  };

  const handleShareImage = async (item: Quote) => {
    try {
      setSelectedQuote(item);

      setTimeout(async () => {
        if (!captureFn) {
          Alert.alert("Error", "Image generator not ready.");
          return;
        }
        const uri = await captureFn();
        await shareFile(uri);
      }, 600);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Unable to share quote image.");
    }
  };

  const handleSaveImage = async (item: Quote) => {
    try {
      setSelectedQuote(item);

      setTimeout(async () => {
        if (!captureFn) {
          Alert.alert("Error", "Image generator not ready.");
          return;
        }

        const uri = await captureFn();

        try {
          await saveImageToGallery(uri);
          Alert.alert("Saved ✅", "Quote card saved to gallery.");
        } catch {
          Alert.alert(
            "Expo Go Limitation ⚠️",
            "Saving to gallery may not work fully in Expo Go. It will work in Development Build."
          );
        }
      }, 600);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Unable to save quote image.");
    }
  };

  const renderHeader = () => (
    <View>
      {/* Quote of the day */}
      <View style={[styles.qodCard, { backgroundColor: ui.card, borderColor: ui.border }]}>
        <View style={styles.qodRow}>
          <Text style={[styles.qodTitle, { color: ui.text, fontSize: ui.fontSize }]}>
            Quote of the Day
          </Text>
          <Ionicons name="sparkles" size={18} color={ui.accent} />
        </View>

        {qod ? (
          <>
            <Text style={[styles.qodQuote, { color: ui.text, fontSize: ui.fontSize + 2 }]}>
              "{qod.quote}"
            </Text>
            <Text style={[styles.qodAuthor, { color: ui.sub, fontSize: ui.fontSize - 1 }]}>
              — {qod.author ? qod.author : "Unknown"}
            </Text>
          </>
        ) : (
          <Text style={{ color: ui.sub }}>Loading quote...</Text>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderColor: ui.border, backgroundColor: ui.card }]}>
        <Ionicons name="search" size={18} color={ui.sub} />
        <TextInput
          style={[styles.searchInput, { color: ui.text, fontSize: ui.fontSize }]}
          placeholder="Search quotes or author..."
          placeholderTextColor={ui.sub}
          value={input}
          onChangeText={setInput}
          returnKeyType="search"
          onSubmitEditing={() => setSearch(input)}
        />
        {input.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setInput("");
              setSearch("");
            }}
          >
            <Ionicons name="close-circle" size={18} color={ui.sub} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
        renderItem={({ item }) => {
          const active = item === category;
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                { borderColor: ui.border, backgroundColor: ui.card },
                active && { backgroundColor: ui.accent, borderColor: ui.accent },
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: ui.text, fontSize: ui.fontSize - 2 },
                  active && { color: "#fff" },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderItem = ({ item }: { item: Quote }) => {
    const isFav = favIds.includes(item.id);

    return (
      <View style={[styles.quoteCard, { backgroundColor: ui.card, borderColor: ui.border }]}>
        <Text style={[styles.quoteText, { color: ui.text, fontSize: ui.fontSize }]}>
          "{item.quote}"
        </Text>

        <View style={styles.quoteFooter}>
          <Text style={[styles.authorText, { color: ui.sub, fontSize: ui.fontSize - 2 }]}>
            — {item.author ?? "Unknown"}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: ui.border }]} onPress={() => handleShareText(item)}>
              <Ionicons name="share-social-outline" size={18} color={ui.text} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: ui.border }]} onPress={() => handleShareImage(item)}>
              <Ionicons name="image-outline" size={18} color={ui.text} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: ui.border }]} onPress={() => handleSaveImage(item)}>
              <Ionicons name="download-outline" size={18} color={ui.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                try {
                  if (isFav) {
                    await removeFavorite(item.id);
                    setFavIds((prev) => prev.filter((x) => x !== item.id));
                  } else {
                    await addFavorite(item.id);
                    setFavIds((prev) => [...prev, item.id]);
                  }
                } catch (e) {
                  console.log("fav error", e);
                }
              }}
              style={[styles.favBtn, { backgroundColor: ui.border }]}
            >
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={20} color={isFav ? "red" : ui.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.categoryTag, { color: ui.sub, fontSize: ui.fontSize - 4 }]}>
          {item.category}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: ui.sub }}>Loading quotes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ui.bg }]}>
      {/* hidden quote card generator */}
      {selectedQuote ? (
        <QuoteCardGenerator
          quote={selectedQuote.quote}
          author={selectedQuote.author}
          accentColor={ui.accent}
          onReady={(cap) => setCaptureFn(() => cap)}
        />
      ) : null}

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={28} color={ui.sub} />
            <Text style={[styles.emptyTitle, { color: ui.text }]}>
              {isSearching ? "No quotes found" : "No quotes available"}
            </Text>
            <Text style={[styles.emptyText, { color: ui.sub }]}>
              Try different search or category.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  qodCard: {
    margin: 16,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  qodRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qodTitle: { fontWeight: "900" },
  qodQuote: { marginTop: 10, fontWeight: "900", lineHeight: 26 },
  qodAuthor: { marginTop: 10, fontWeight: "700" },

  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1 },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 10,
  },
  chipText: { fontWeight: "800" },

  quoteCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  quoteText: { fontWeight: "900", lineHeight: 24 },
  quoteFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  authorText: { fontWeight: "800", flex: 1 },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryTag: { marginTop: 10, fontWeight: "800" },

  emptyWrap: { alignItems: "center", padding: 30 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900" },
  emptyText: { marginTop: 6, fontWeight: "600" },
});
