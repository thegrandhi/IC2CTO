import { Stack } from 'expo-router';
import { useColors } from '../../../lib/theme';

export default function TabStack() {
  const c = useColors();
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: process.env.EXPO_OS === 'ios',
        headerBlurEffect: 'systemChromeMaterial',
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerTintColor: c.accent,
        contentStyle: { backgroundColor: c.bg },
      }}
    />
  );
}
