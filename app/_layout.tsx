import { Stack } from "expo-router";
import { AuthProvider } from "@/app/context/AuthContext";
import { FavoritesProvider } from "@/app/context/FavoritesContext";
import { StatusBar } from "expo-status-bar";

if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="property/[id]" />
          <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="landlord" />
          <Stack.Screen name="add-property" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </FavoritesProvider>
    </AuthProvider>
  );
}
