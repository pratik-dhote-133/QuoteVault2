import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../src/lib/supabase";
import { scheduleDailyQuoteNotification } from "../../src/services/notifications";
import {
  AccentColor,
  DEFAULT_SETTINGS,
  loadCloudSettings,
  loadLocalSettings,
  saveLocalSettings,
  ThemeMode,
  upsertCloudSettings,
  UserSettings,
} from "../../src/services/settings";

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // ✅ dynamic UI based on theme + accent
  const ui = useMemo(() => {
    const isDark = settings.themeMode === "dark";

    const accentMap: Record<AccentColor, string> = {
      black: "#111111",
      blue: "#2563EB",
      purple: "#7C3AED",
    };

    return {
      isDark,
      bg: isDark ? "#0B0B0B" : "#FFFFFF",
      card: isDark ? "#141414" : "#FFFFFF",
      border: isDark ? "#262626" : "#E5E7EB",
      text: isDark ? "#FFFFFF" : "#111111",
      sub: isDark ? "#C7C7C7" : "#6B7280",
      accent: accentMap[settings.accentColor],
    };
  }, [settings]);

  // ✅ load settings (local + cloud merge)
  const loadAll = async () => {
    setLoading(true);
    try {
      const local = await loadLocalSettings();
      setSettings(local);

      const cloud = await loadCloudSettings();
      if (cloud) {
        const merged = { ...local, ...cloud };
        setSettings(merged);

        // keep local updated
        await saveLocalSettings(merged);
      }
    } catch (e) {
      console.log("settings load error", e);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const update = async (updated: UserSettings) => {
    setSettings(updated);

    // save local quickly
    try {
      await saveLocalSettings(updated);
    } catch (e) {
      console.log("saveLocalSettings error", e);
    }

    // save cloud silently
    try {
      await upsertCloudSettings(updated);
    } catch (e) {
      console.log("upsertCloudSettings error", e);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch (e) {
      console.log("logout error", e);
      Alert.alert("Error", "Logout failed. Try again.");
    }
  };

  const cycleAccent = () => {
    const order: AccentColor[] = ["black", "blue", "purple"];
    const currentIndex = order.indexOf(settings.accentColor);
    const next = order[(currentIndex + 1) % order.length];
    update({ ...settings, accentColor: next });
  };

  const increaseFont = () => {
    const next = Math.min(settings.fontSize + 1, 22);
    update({ ...settings, fontSize: next });
  };

  const decreaseFont = () => {
    const next = Math.max(settings.fontSize - 1, 12);
    update({ ...settings, fontSize: next });
  };

  const toggleTheme = () => {
    const next: ThemeMode = settings.themeMode === "light" ? "dark" : "light";
    update({ ...settings, themeMode: next });
  };

  // ✅ validates HH:MM
  const isValidTime = (value: string) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
    return match;
  };

  // ✅ daily quote picker
  const openTimePicker = () => {
    Alert.alert("Daily Quote Time", "Choose a time for daily quote reminder.", [
      {
        text: "8:00 AM",
        onPress: async () => await setNotificationTime("08:00"),
      },
      {
        text: "9:00 AM",
        onPress: async () => await setNotificationTime("09:00"),
      },
      {
        text: "7:00 PM",
        onPress: async () => await setNotificationTime("19:00"),
      },
      {
        text: "Custom",
        onPress: () => openCustomTimeInput(),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCustomTimeInput = () => {
    let input = settings.notificationTime || "08:00";

    Alert.prompt(
  "Set Custom Time",
  "Enter time in HH:MM format (Example: 08:30)",
  [
    { text: "Cancel", style: "cancel" },
    {
      text: "Save",
      onPress: (value ? : string) => {
        (async () => {
          if (!value) return;

          const input = value.trim();

          if (!isValidTime(input)) {
            Alert.alert("Invalid time", "Please enter in HH:MM format (e.g., 08:30)");
            return;
          }

          await setNotificationTime(input);
        })();
      },
    },
  ],
  "plain-text",
  settings.notificationTime || "08:00"
);

  };

  const setNotificationTime = async (time: string) => {
    const updated = { ...settings, notificationTime: time };
    await update(updated);

    // ✅ schedule notification
    try {
      await scheduleDailyQuoteNotification(time);
      Alert.alert("✅ Reminder Set", `You will get daily quote at ${time}`);
    } catch (e) {
      console.log("schedule notification error", e);
      Alert.alert("Error", "Failed to schedule notification.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: ui.sub }}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ui.bg }]}>
      <Text style={[styles.title, { color: ui.text, fontSize: settings.fontSize + 6 }]}>
        Settings
      </Text>

      {/* Theme */}
      <View style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Ionicons name="moon-outline" size={20} color={ui.text} />
            <Text style={[styles.rowText, { color: ui.text, fontSize: settings.fontSize }]}>
              Dark Mode
            </Text>
          </View>
          <Switch value={settings.themeMode === "dark"} onValueChange={toggleTheme} />
        </View>
      </View>

      {/* Accent Color */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}
        onPress={cycleAccent}
      >
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Ionicons name="color-palette-outline" size={20} color={ui.text} />
            <Text style={[styles.rowText, { color: ui.text, fontSize: settings.fontSize }]}>
              Accent Color
            </Text>
          </View>
          <Text style={[styles.valueText, { color: ui.accent, fontSize: settings.fontSize - 1 }]}>
            {settings.accentColor}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Font Size */}
      <View style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Ionicons name="text-outline" size={20} color={ui.text} />
            <Text style={[styles.rowText, { color: ui.text, fontSize: settings.fontSize }]}>
              Font Size
            </Text>
          </View>

          <View style={styles.fontControls}>
            <TouchableOpacity
              style={[styles.fontBtn, { backgroundColor: ui.border }]}
              onPress={decreaseFont}
            >
              <Ionicons name="remove" size={18} color={ui.text} />
            </TouchableOpacity>

            <Text style={[styles.valueText, { color: ui.text, fontSize: settings.fontSize }]}>
              {settings.fontSize}
            </Text>

            <TouchableOpacity
              style={[styles.fontBtn, { backgroundColor: ui.border }]}
              onPress={increaseFont}
            >
              <Ionicons name="add" size={18} color={ui.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Daily Quote Time */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}
        onPress={openTimePicker}
      >
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={20} color={ui.text} />
            <Text style={[styles.rowText, { color: ui.text, fontSize: settings.fontSize }]}>
              Daily Quote Time
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[styles.valueText, { color: ui.text, fontSize: settings.fontSize - 1 }]}>
              {settings.notificationTime}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={ui.sub} />
          </View>
        </View>

        <Text style={[styles.smallText, { color: ui.sub, fontSize: settings.fontSize - 3 }]}>
          Tap to change reminder time
        </Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: ui.accent }]} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={[styles.logoutText, { fontSize: settings.fontSize }]}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontWeight: "900", marginBottom: 12 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { fontWeight: "700" },
  valueText: { fontWeight: "800" },

  smallText: { marginTop: 8 },

  fontControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  fontBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  logoutBtn: {
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  logoutText: { color: "#fff", fontWeight: "900" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
