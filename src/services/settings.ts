import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { themeEvents } from "../utils/themeEvents"; // ✅ FIXED

export type ThemeMode = "light" | "dark";
export type AccentColor = "black" | "blue" | "purple";

export type UserSettings = {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  fontSize: number;
  notificationTime: string; // "08:00"
};

export const DEFAULT_SETTINGS: UserSettings = {
  themeMode: "light",
  accentColor: "black",
  fontSize: 16,
  notificationTime: "08:00",
};

const LOCAL_KEY = "quotevault_settings";

// ✅ Load local settings
export async function loadLocalSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UserSettings>) };
  } catch (e) {
    console.log("loadLocalSettings error", e);
    return DEFAULT_SETTINGS;
  }
}

// ✅ Save local settings (UPDATED)
export async function saveLocalSettings(settings: UserSettings) {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(settings));

    // ✅ notify all tabs/screens instantly
    themeEvents.emit();
  } catch (e) {
    console.log("saveLocalSettings error", e);
  }
}

// ✅ Load cloud settings
export async function loadCloudSettings(): Promise<Partial<UserSettings> | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("user_settings")
      .select("theme, accent, font_scale, notify_time")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log("loadCloudSettings error", error);
      return null;
    }

    if (!data) return null;

    return {
      themeMode: (data.theme as ThemeMode) ?? "light",
      accentColor: ((data.accent as string) === "#2563EB"
        ? "blue"
        : (data.accent as string) === "#7C3AED"
        ? "purple"
        : "black") as AccentColor,
      fontSize: Math.round((data.font_scale ?? 1) * 16),
      notificationTime: data.notify_time ?? "08:00",
    };
  } catch (e) {
    console.log("loadCloudSettings fatal error", e);
    return null;
  }
}

// ✅ Save cloud settings (upsert)
export async function upsertCloudSettings(settings: UserSettings) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const accentMap: Record<AccentColor, string> = {
      black: "#111111",
      blue: "#2563EB",
      purple: "#7C3AED",
    };

    const payload = {
      user_id: user.id,
      theme: settings.themeMode,
      accent: accentMap[settings.accentColor],
      font_scale: settings.fontSize / 16,
      notify_time: settings.notificationTime,
    };

    const { error } = await supabase.from("user_settings").upsert(payload);

    if (error) {
      console.log("upsertCloudSettings error", error);
    }

    // ✅ notify after cloud update also
    themeEvents.emit();
  } catch (e) {
    console.log("upsertCloudSettings fatal error", e);
  }
}

// ✅ merged loader helper
export async function loadSettingsMerged(): Promise<UserSettings> {
  const local = await loadLocalSettings();
  const cloud = await loadCloudSettings();
  return { ...local, ...(cloud ?? {}) };
}
