import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

/**
 * Save an image to device gallery.
 * NOTE: Expo Go has limitations on Android media library.
 */
export async function saveImageToGallery(fileUri: string) {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Media permission not granted");
  }

  const asset = await MediaLibrary.createAssetAsync(fileUri);

  // Album create (fails silently sometimes on Expo Go)
  try {
    await MediaLibrary.createAlbumAsync("QuoteVault", asset, false);
  } catch {}

  return true;
}

/**
 * Share any file using system share sheet.
 */
export async function shareFile(fileUri: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing not available on this device.");
  }

  await Sharing.shareAsync(fileUri);
}

/**
 * Share quote as plain text.
 */

export async function shareQuoteText(quote: string, author?: string | null) {
  const text = `"${quote}"\n— ${author ?? "Unknown"}\n\nvia QuoteVault`;

  await Share.share({
    message: text,
  });
}

