import { SymbolView, type SymbolWeight } from 'expo-symbols';
import type { ColorValue } from 'react-native';

// SF Symbols on iOS; the Material equivalents are used on Android and in the web preview.
const ICONS = {
  check: ['checkmark', 'check'],
  x: ['xmark', 'close'],
  chevron: ['chevron.right', 'chevron_right'],
  up: ['chevron.up', 'keyboard_arrow_up'],
  down: ['chevron.down', 'keyboard_arrow_down'],
  flame: ['flame.fill', 'local_fire_department'],
  bolt: ['bolt.fill', 'bolt'],
  book: ['book', 'menu_book'],
  chat: ['bubble.left.and.bubble.right', 'forum'],
  gear: ['gearshape', 'settings'],
  arrow: ['arrow.right', 'arrow_forward'],
  reset: ['arrow.counterclockwise', 'restart_alt'],
  undo: ['arrow.uturn.backward', 'undo'],
  calendar: ['calendar', 'calendar_today'],
  clock: ['clock', 'schedule'],
  done: ['checkmark.circle.fill', 'check_circle'],
  circle: ['circle', 'radio_button_unchecked'],
  retry: ['arrow.trianglehead.2.clockwise', 'replay'],
  person: ['person.fill', 'person'],
  doc: ['doc.text', 'description'],
  path: ['point.topleft.down.to.point.bottomright.curvepath', 'route'],
  tray: ['tray', 'inbox'],
  laptop: ['laptopcomputer', 'laptop'],
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 17, color, weight = 'semibold' }: { name: IconName; size?: number; color: ColorValue; weight?: SymbolWeight }) {
  const [ios, md] = ICONS[name];
  return <SymbolView name={{ ios, android: md, web: md }} size={size} tintColor={color} weight={weight} />;
}
