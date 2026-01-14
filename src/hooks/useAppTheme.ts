import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SETTINGS, loadLocalSettings } from "../services/settings";
import { themeEvents } from "../utils/themeEvents";

export function useAppTheme() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const reloadTheme = async () => {
    const local = await loadLocalSettings();
    setSettings(local);
  };

  useEffect(() => {
    reloadTheme();

    // ✅ listen for theme updates
    const unsubscribe = themeEvents.on(() => {
      reloadTheme();
    });

    return () => unsubscribe();
  }, []);

  const ui = useMemo(() => {
    const isDark = settings.themeMode === "dark";

    const accentMap = {
      black: "#111111",
      blue: "#2563EB",
      purple: "#7C3AED",
    };

    return {
      fontSize: settings.fontSize,
      isDark,
      bg: isDark ? "#0B0B0B" : "#FFFFFF",
      card: isDark ? "#141414" : "#FFFFFF",
      border: isDark ? "#262626" : "#E5E7EB",
      text: isDark ? "#FFFFFF" : "#111111",
      sub: isDark ? "#C7C7C7" : "#6B7280",
      accent: accentMap[settings.accentColor],
    };
  }, [settings]);

  return { ui, settings, reloadTheme };
}
