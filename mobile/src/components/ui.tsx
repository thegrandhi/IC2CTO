import { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { haptic } from '../lib/haptics';
import { radius, space, useColors } from '../lib/theme';
import { Icon, type IconName } from './Icon';

// ------------------------------------------------------------------ type ramp (iOS text styles)

export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24 },
  callout: { fontSize: 16, lineHeight: 22 },
  subhead: { fontSize: 15, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

type Tone = 'label' | 'secondary' | 'tertiary' | 'accent' | 'pass' | 'fail' | 'warn' | 'onAccent';

export function T({ v = 'body', tone = 'label', style, ...rest }: TextProps & { v?: keyof typeof type; tone?: Tone }) {
  const c = useColors();
  return <Text {...rest} style={[type[v], { color: c[tone] }, style]} />;
}

// ------------------------------------------------------------------ layout

/** Root scroll view for a screen: content scrolls under the large title and the tab bar. */
export function Screen({ children, contentContainerStyle, ...rest }: ScrollViewProps & { children: ReactNode }) {
  const c = useColors();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[{ padding: space, paddingBottom: space * 3, gap: space }, contentContainerStyle]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', padding: space }, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: -6, paddingHorizontal: 4 }}>
      <T v="title3">{children}</T>
      {action}
    </View>
  );
}

// ------------------------------------------------------------------ pressables

const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

/** Press feedback for buttons and cards: scale to 0.97 on press-in. */
export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  hitSlop,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPressIn={() => scale.set(withTiming(0.97, { duration: 100, easing: easeOut }))}
      onPressOut={() => scale.set(withTiming(1, { duration: 150, easing: easeOut }))}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'plain';
  icon?: IconName;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = kind === 'primary' ? c.accent : kind === 'secondary' ? c.fill : 'transparent';
  const fg = kind === 'primary' ? c.onAccent : kind === 'secondary' ? c.label : c.accent;
  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      disabled={disabled}
      style={[
        {
          backgroundColor: bg,
          minHeight: small ? 36 : 50,
          paddingHorizontal: small ? 14 : 20,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={small ? 14 : 16} color={fg} />}
      <Text style={[small ? type.subhead : type.headline, { color: fg, fontWeight: '600' }]}>{title}</Text>
    </PressableScale>
  );
}

/** A grouped-list row: highlights on press (never scales). */
export function Row({
  title,
  subtitle,
  detail,
  left,
  onPress,
  last,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: string;
  left?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ backgroundColor: pressed ? c.fill : 'transparent' })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: space, minHeight: 52 }}>
        {left}
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 11,
            paddingRight: space,
            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: c.separator,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            {typeof title === 'string' ? <T>{title}</T> : title}
            {typeof subtitle === 'string' ? (
              <T v="footnote" tone="secondary">
                {subtitle}
              </T>
            ) : (
              subtitle
            )}
          </View>
          {detail !== undefined && (
            <T v="subhead" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
              {detail}
            </T>
          )}
          {onPress && <Icon name="chevron" size={13} color={c.tertiary} />}
        </View>
      </View>
    </Pressable>
  );
}

export function Group({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ backgroundColor: c.card, borderRadius: radius.card, borderCurve: 'continuous', overflow: 'hidden' }, style]}>{children}</View>;
}

// ------------------------------------------------------------------ small pieces

export function Pill({ children, color }: { children: string; color?: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.fill, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
      {color && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />}
      <T v="caption" tone="secondary" style={{ fontWeight: '600' }}>
        {children}
      </T>
    </View>
  );
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const c = useColors();
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, backgroundColor: color ?? c.accent }} />
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 }}>
      <Icon name={icon} size={40} color={c.tertiary} weight="regular" />
      <T v="title3" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T v="subhead" tone="secondary" style={{ textAlign: 'center' }}>
        {body}
      </T>
      {action}
    </View>
  );
}
