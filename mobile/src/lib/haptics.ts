import * as Haptics from 'expo-haptics';
import { getState } from './store';

const on = () => process.env.EXPO_OS === 'ios' && getState().settings.haptics !== false;

/** Haptics are punctuation: one per user action, on the same frame as the visual. */
export const haptic = {
  select: () => on() && Haptics.selectionAsync(),
  tap: () => on() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warn: () => on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
