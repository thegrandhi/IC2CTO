import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { Button, Card, Empty, Group, Pill, Screen, SectionTitle, T, type } from '../components/ui';
import { getDesign, getInterview } from '../lib/content';
import { DESIGN_STEPS } from '../lib/shared';
import { attemptScore, interviewDraftKey, storage, useAppSelector } from '../lib/store';
import { useColors } from '../lib/theme';

export function DesignScreen({ id }: { id: string }) {
  const c = useColors();
  const design = getDesign(id);
  const items = getInterview(id);
  const attempts = useAppSelector((s) => s.designs[id]);
  const [inProgress, setInProgress] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setInProgress(!!storage.get(interviewDraftKey(id)));
    }, [id]),
  );

  if (!design) return <Empty icon="chat" title="Prompt not found" body="It may have been renamed in an update." />;

  const history = attempts ?? [];
  const best = history.length ? Math.max(...history.map(attemptScore)) : null;

  return (
    <>
      <Stack.Screen options={{ title: design.title, headerLargeTitle: false }} />
      <Screen>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pill color={design.difficulty === 'Hard' ? c.fail : design.difficulty === 'Medium' ? c.warn : c.pass}>{design.difficulty}</Pill>
          {design.tags.slice(0, 3).map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
        </View>
        <T v="title1">{design.title}</T>
        <Markdown text={design.prompt} base={type.callout} />

        {items ? (
          <Card style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="chat" size={18} color={c.accent} />
              <T v="headline">Guided interview</T>
              <T v="footnote" tone="secondary" style={{ marginLeft: 'auto' }}>
                ~15 min · {items.length} steps
              </T>
            </View>
            <T v="subhead" tone="secondary">
              An interviewer walks you through the prompt. Spend a few clarifying questions, estimate, choose between designs and build the request paths. Every choice gets feedback, and you finish with a scorecard.
            </T>
            <Button
              title={inProgress ? 'Resume interview' : history.length ? 'Interview again' : 'Start interview'}
              icon={inProgress ? 'arrow' : undefined}
              onPress={() => router.push(`/interview/${id}`)}
            />
          </Card>
        ) : (
          <Card>
            <T v="subhead" tone="secondary">
              This prompt has no guided interview yet. Practice it on the whiteboard in the web app.
            </T>
          </Card>
        )}

        {history.length > 0 && (
          <>
            <SectionTitle>History</SectionTitle>
            <Card style={{ gap: 8 }}>
              <T v="subhead" tone="secondary">
                {history.length} session{history.length > 1 ? 's' : ''}
                {best !== null ? ` · best ${Math.round(best * 100)}%` : ''}
              </T>
              {history
                .slice(-5)
                .reverse()
                .map((a) => (
                  <View key={a.at} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T v="subhead">{new Date(a.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</T>
                    <T v="subhead" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
                      {a.mode === 'whiteboard' ? 'Whiteboard' : 'Guided'} · {a.minutes} min · {Math.round(attemptScore(a) * 100)}%
                    </T>
                  </View>
                ))}
            </Card>
          </>
        )}

        <SectionTitle>Reference answer</SectionTitle>
        <T v="footnote" tone="secondary" style={{ marginTop: -8, paddingHorizontal: 4 }}>
          Try the interview first. Then compare.
        </T>
        <Group>
          {DESIGN_STEPS.map((st, i) => {
            const expanded = open === st.key;
            return (
              <View key={st.key} style={{ borderTopWidth: i ? 0.5 : 0, borderTopColor: c.separator }}>
                <Pressable
                  onPress={() => setOpen(expanded ? null : st.key)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', padding: 16, minHeight: 52, backgroundColor: pressed ? c.fill : 'transparent' })}
                >
                  <T v="body" style={{ flex: 1 }}>
                    {i + 1}. {st.title}
                  </T>
                  <Icon name={expanded ? 'up' : 'down'} size={13} color={c.tertiary} />
                </Pressable>
                {expanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Markdown text={design.reference[st.key]} base={type.subhead} />
                  </View>
                )}
              </View>
            );
          })}
        </Group>
      </Screen>
    </>
  );
}
