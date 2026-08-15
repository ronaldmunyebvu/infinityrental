import { Stack } from "expo-router";
import { AuthProvider } from "@/app/context/AuthContext";
import { SubscriberProvider } from "@/app/context/SubscriberContext";
import { FavoritesProvider } from "@/app/context/FavoritesContext";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";

if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
}

// Preload the icon font up front so @expo/vector-icons' lazy loadAsync
// (which rejects uncaught with "6000ms timeout exceeded" on web when the
// font is slow to download) never runs during the first render.
if (typeof window !== 'undefined') {
  Font.loadAsync(Ionicons.font).catch((error: unknown) => {
    console.warn('Preloaded icon font failed to load:', error instanceof Error ? error.message : error);
  });
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriberProvider>
        <FavoritesProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="favorites" />
            <Stack.Screen name="property/[id]" />
            <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="landlord" />
            <Stack.Screen name="add-property" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="edit-property" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="contact" />
            <Stack.Screen name="about" />
            <Stack.Screen name="how-it-works" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="more" />
          </Stack>
        </FavoritesProvider>
      </SubscriberProvider>
    </AuthProvider>
  );
}
