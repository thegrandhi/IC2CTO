// Renders the app's bundled Markdown with native Text and View, using marked's lexer.
import { marked, type Token, type Tokens } from 'marked';
import { memo, useMemo, type ReactNode } from 'react';
import { Linking, ScrollView, Text, View, type TextStyle } from 'react-native';
import { mono, radius, useColors, type Palette } from '../lib/theme';
import { type } from './ui';

type Base = TextStyle;

function inline(tokens: Token[] | undefined, c: Palette, base: Base, key = ''): ReactNode[] {
  if (!tokens) return [];
  return tokens.map((t, i): ReactNode => {
    const k = `${key}${i}`;
    switch (t.type) {
      case 'strong':
        return (
          <Text key={k} style={{ fontWeight: '700' }}>
            {inline((t as Tokens.Strong).tokens, c, base, k)}
          </Text>
        );
      case 'em':
        return (
          <Text key={k} style={{ fontStyle: 'italic' }}>
            {inline((t as Tokens.Em).tokens, c, base, k)}
          </Text>
        );
      case 'del':
        return (
          <Text key={k} style={{ textDecorationLine: 'line-through' }}>
            {inline((t as Tokens.Del).tokens, c, base, k)}
          </Text>
        );
      case 'codespan':
        return (
          <Text key={k} style={{ fontFamily: mono, fontSize: (base.fontSize ?? 17) * 0.88, backgroundColor: c.fill }}>
            {decode((t as Tokens.Codespan).text)}
          </Text>
        );
      case 'link': {
        const link = t as Tokens.Link;
        return (
          <Text key={k} style={{ color: c.accent }} onPress={/^https?:/.test(link.href) ? () => Linking.openURL(link.href) : undefined}>
            {inline(link.tokens, c, base, k)}
          </Text>
        );
      }
      case 'br':
        return '\n';
      case 'text': {
        const text = t as Tokens.Text;
        return text.tokens ? <Text key={k}>{inline(text.tokens, c, base, k)}</Text> : decode(text.text);
      }
      case 'escape':
        return decode((t as Tokens.Escape).text);
      default:
        return decode((t as { raw: string }).raw);
    }
  });
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);

function blocks(tokens: Token[], c: Palette, base: Base, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  tokens.forEach((t, i) => {
    const k = `${key}${i}`;
    switch (t.type) {
      case 'space':
        return;
      case 'paragraph':
        out.push(
          <Text key={k} style={[base, { color: c.label }]} selectable>
            {inline((t as Tokens.Paragraph).tokens, c, base, k)}
          </Text>,
        );
        return;
      case 'heading': {
        const h = t as Tokens.Heading;
        out.push(
          <Text key={k} style={[h.depth <= 2 ? type.title3 : type.headline, { color: c.label, marginTop: 6 }]} accessibilityRole="header">
            {inline(h.tokens, c, base, k)}
          </Text>,
        );
        return;
      }
      case 'code':
        out.push(<CodeBlock key={k} code={(t as Tokens.Code).text} c={c} />);
        return;
      case 'list': {
        const list = t as Tokens.List;
        out.push(
          <View key={k} style={{ gap: 6 }}>
            {list.items.map((item, n) => (
              <View key={n} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={[base, { color: c.secondary, minWidth: list.ordered ? 20 : 10, fontVariant: ['tabular-nums'] }]}>
                  {list.ordered ? `${Number(list.start || 1) + n}.` : '•'}
                </Text>
                <View style={{ flex: 1, gap: 6 }}>{blocks(item.tokens, c, base, `${k}.${n}.`)}</View>
              </View>
            ))}
          </View>,
        );
        return;
      }
      case 'table':
        out.push(<Table key={k} table={t as Tokens.Table} c={c} />);
        return;
      case 'blockquote':
        out.push(
          <View key={k} style={{ borderLeftWidth: 3, borderLeftColor: c.separator, paddingLeft: 12, gap: 8 }}>
            {blocks((t as Tokens.Blockquote).tokens, c, { ...base, color: c.secondary }, k)}
          </View>,
        );
        return;
      case 'hr':
        out.push(<View key={k} style={{ height: 1, backgroundColor: c.separator }} />);
        return;
      case 'text': {
        const text = t as Tokens.Text;
        out.push(
          <Text key={k} style={[base, { color: c.label }]} selectable>
            {text.tokens ? inline(text.tokens, c, base, k) : decode(text.text)}
          </Text>,
        );
        return;
      }
      default:
        if ('raw' in t && t.raw.trim()) {
          out.push(
            <Text key={k} style={[base, { color: c.label }]}>
              {t.raw.trim()}
            </Text>,
          );
        }
    }
  });
  return out;
}

export function CodeBlock({ code, c }: { code: string; c: Palette }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ backgroundColor: c.code, borderRadius: radius.chip, borderCurve: 'continuous' }}
      contentContainerStyle={{ padding: 12 }}
    >
      <Text selectable style={{ fontFamily: mono, fontSize: 13, lineHeight: 19, color: c.label }}>
        {code}
      </Text>
    </ScrollView>
  );
}

function Table({ table, c }: { table: Tokens.Table; c: Palette }) {
  const base = type.footnote;
  const cell = (tokens: Token[], header: boolean, k: string) => (
    <View key={k} style={{ width: 140, padding: 8 }}>
      <Text style={[base, { color: c.label, fontWeight: header ? '600' : '400' }]}>{inline(tokens, c, base, k)}</Text>
    </View>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.chip, backgroundColor: c.code }}>
      <View>
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.separator }}>
          {table.header.map((h, i) => cell(h.tokens, true, `h${i}`))}
        </View>
        {table.rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', borderBottomWidth: r < table.rows.length - 1 ? 0.5 : 0, borderBottomColor: c.separator }}>
            {row.map((x, i) => cell(x.tokens, false, `${r}.${i}`))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** Block Markdown: paragraphs, lists, code, tables. */
export const Markdown = memo(function Markdown({ text, base = type.body }: { text: string; base?: Base }) {
  const c = useColors();
  const nodes = useMemo(() => blocks(marked.lexer(text, { gfm: true }), c, base), [text, c, base]);
  return <View style={{ gap: 12 }}>{nodes}</View>;
});

/** Inline Markdown (bold, code, links) for options and short labels. */
export const InlineMd = memo(function InlineMd({ text, base = type.body, color }: { text: string; base?: Base; color?: string }) {
  const c = useColors();
  const nodes = useMemo(() => inline(marked.Lexer.lexInline(text, { gfm: true }), c, base), [text, c, base]);
  return <Text style={[base, { color: color ?? c.label }]}>{nodes}</Text>;
});
