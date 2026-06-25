import { Stack } from "expo-router";
import { AuthProvider } from "@/app/context/AuthContext";
import { SubscriberProvider } from "@/app/context/SubscriberContext";
import { FavoritesProvider } from "@/app/context/FavoritesContext";
import { StatusBar } from "expo-status-bar";

if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
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
