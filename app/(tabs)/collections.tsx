import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

import { useAppTheme } from "../../src/hooks/useAppTheme";
import {
  Collection,
  createCollection,
  deleteCollection,
  fetchCollections,
} from "../../src/services/collections";

export default function CollectionsScreen() {
  const router = useRouter();
  const { ui, reloadTheme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState("");

  const count = useMemo(() => collections.length, [collections]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await fetchCollections();
      setCollections(data);
    } catch (e) {
      console.log(e);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTheme();
    loadCollections();
  }, []);

  const onCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;

    try {
      setCreating(true);
      await createCollection(trimmed);
      setName("");
      await loadCollections();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to create collection.");
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    Alert.alert("Delete Collection", "Are you sure you want to delete this collection?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCollection(id);
            await loadCollections();
          } catch (e) {
            console.log(e);
            Alert.alert("Error", "Failed to delete collection.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: ui.sub }}>Loading collections...</Text>
      </SafeAreaView>
    );
  }

  const canCreate = name.trim().length > 0 && !creating;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ui.bg }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: ui.text, fontSize: ui.fontSize + 8 }]}>
          Collections
        </Text>

        <View style={[styles.badge, { backgroundColor: ui.border }]}>
          <Ionicons name="albums" size={14} color={ui.text} />
          <Text style={[styles.badgeText, { color: ui.text }]}>{count}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: ui.sub, fontSize: ui.fontSize - 1 }]}>
        Create your own quote collections ✨
      </Text>

      {/* Create input */}
      <View style={[styles.createWrap, { borderColor: ui.border, backgroundColor: ui.card }]}>
        <Ionicons name="add-circle-outline" size={20} color={ui.sub} />
        <TextInput
          style={[styles.input, { color: ui.text, fontSize: ui.fontSize }]}
          placeholder="New collection name..."
          value={name}
          onChangeText={setName}
          placeholderTextColor={ui.sub}
          returnKeyType="done"
          onSubmitEditing={onCreate}
        />

        <TouchableOpacity
          onPress={onCreate}
          style={[
            styles.addBtn,
            { backgroundColor: ui.accent },
            !canCreate && styles.addBtnDisabled,
          ]}
          disabled={!canCreate}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="add" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/collection/[id]" as any,
                params: { id: item.id, name: item.name },
              });
            }}
            style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: ui.text, fontSize: ui.fontSize + 1 }]}>
                {item.name}
              </Text>
              <Text style={[styles.subText, { color: ui.sub, fontSize: ui.fontSize - 2 }]}>
                Tap to view saved quotes
              </Text>
            </View>

            <View style={styles.rightRow}>
              <TouchableOpacity
                onPress={() => onDelete(item.id)}
                style={[styles.deleteBtn, { backgroundColor: ui.isDark ? "#2A1212" : "#FEE2E2" }]}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>

              <Ionicons name="chevron-forward" size={20} color={ui.sub} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="albums-outline" size={34} color={ui.sub} />
            <Text style={[styles.emptyTitle, { color: ui.text }]}>No collections yet</Text>
            <Text style={[styles.emptyText, { color: ui.sub }]}>
              Create your first collection above 👆
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
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

  createWrap: {
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, fontWeight: "700" },

  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnDisabled: { opacity: 0.4 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "900" },
  subText: { marginTop: 6, fontWeight: "700" },

  rightRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  deleteBtn: {
    padding: 10,
    borderRadius: 14,
  },

  emptyWrap: { alignItems: "center", padding: 36, marginTop: 40 },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: "900" },
  emptyText: { marginTop: 8, textAlign: "center", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
