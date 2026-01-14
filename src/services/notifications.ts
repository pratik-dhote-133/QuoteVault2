import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fetchQuoteOfTheDay } from "./quotes";

//  Configure notification behavior (banner + sound)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,  
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


// Ask permission (and create android channel)
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Notifications only work on real device");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return false;
  }

  //  Android requires notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-quote", {
      name: "Daily Quote",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }

  return true;
}

//  Parse "08:30" => { hour: 8, minute: 30 }
export function parseTimeString(time: string) {
  const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
  return { hour: hh || 8, minute: mm || 0 };
}

//  Cancel all schedules
export async function cancelDailyQuoteNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

//  Schedule daily quote notification at chosen time
export async function scheduleDailyQuoteNotification(time: string) {
  const ok = await requestNotificationPermissions();
  if (!ok) return;

  // clean old schedules
  await cancelDailyQuoteNotifications();

  // fetch Quote of the Day
  const qod = await fetchQuoteOfTheDay();

  const { hour, minute } = parseTimeString(time);

  //  Trigger type fix (Expo TS requires DailyTriggerInput)
 const trigger: Notifications.DailyTriggerInput = {
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour,
  minute,
};



  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✨ QuoteVault — Quote of the Day",
      body: qod
        ? `"${qod.quote}" — ${qod.author ?? "Unknown"}`
        : "Stay inspired today 💪",
      sound: "default",
    },
    trigger,
  });

  console.log(` Daily quote scheduled at ${hour}:${minute}`);
}
