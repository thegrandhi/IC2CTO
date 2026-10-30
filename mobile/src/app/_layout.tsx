import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppSelector } from '../lib/store';
import { useColors, useScheme } from '../lib/theme';

export default function RootLayout() {
  const setting = useAppSelector((s) => s.settings.theme);
  const scheme = useScheme();
  const c = useColors();

  // Native chrome (bars, sheets, switches) follows the in-app theme setting too.
  useEffect(() => {
    if (process.env.EXPO_OS !== 'web') Appearance.setColorScheme(setting === 'system' ? 'unspecified' : setting);
  }, [setting]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: c.accent, background: c.bg, card: c.card, text: c.label, border: c.separator } };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerTintColor: c.accent, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* A quiz set is a self-contained task: a sheet with its own Close. Answers save as you go, so swipe-to-dismiss is safe. */}
          <Stack.Screen name="session" options={{ presentation: 'modal' }} />
          {/* The guided interview is immersive and long; it saves a draft continuously. */}
          <Stack.Screen name="interview/[id]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="read/[id]" options={{ presentation: 'modal', title: '' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
