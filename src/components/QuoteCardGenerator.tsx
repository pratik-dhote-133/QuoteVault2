import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";

type Props = {
  quote: string;
  author?: string | null;
  accentColor?: string;
  onReady: (capture: () => Promise<string>) => void;
};

export default function QuoteCardGenerator({
  quote,
  author,
  accentColor = "#2563EB",
  onReady,
}: Props) {
  const shotRef = useRef<ViewShot>(null);

  // ✅ capture function exposed to parent
  const exportQuoteCardAsImage = async () => {
    if (!shotRef.current) throw new Error("ViewShot ref missing");

    // ✅ FIX: allow UI render before capture (fix black image)
    await new Promise((res) => setTimeout(res, 300));

    const uri = await shotRef.current.capture?.();
    if (!uri) throw new Error("Failed to capture image");

    return uri;
  };

  // ✅ send capture function to parent
  useEffect(() => {
    onReady(exportQuoteCardAsImage);
  }, [quote, author]);

  return (
    <View style={styles.hiddenWrap}>
      <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
        <View style={[styles.card, { borderColor: accentColor }]}>
          <Text style={styles.quote}>"{quote}"</Text>

          <View style={[styles.badge, { backgroundColor: accentColor }]} />

          <Text style={styles.author}>— {author ?? "Unknown"}</Text>

          <Text style={styles.footer}>QuoteVault</Text>
        </View>
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenWrap: {
    position: "absolute",
    left: -1000,
    top: -1000,
    opacity: 0,
  },
  card: {
    width: 340,
    padding: 18,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  quote: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    lineHeight: 26,
  },
  badge: {
    marginTop: 16,
    width: 60,
    height: 6,
    borderRadius: 999,
  },
  author: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
  },
  footer: {
    marginTop: 18,
    fontSize: 12,
    fontWeight: "800",
    color: "#9CA3AF",
    textAlign: "right",
  },
});
