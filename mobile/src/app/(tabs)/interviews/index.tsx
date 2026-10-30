import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Card, Group, Row, Screen, T } from '../../../components/ui';
import { allDesigns, getInterview } from '../../../lib/content';
import { attemptScore, interviewDraftKey, storage, useAppSelector } from '../../../lib/store';
import { useColors } from '../../../lib/theme';

export default function Designs() {
  const c = useColors();
  const history = useAppSelector((s) => s.designs);
  const designs = allDesigns();
  const [drafts, setDrafts] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      setDrafts(new Set(allDesigns().filter((d) => storage.get(interviewDraftKey(d.id))).map((d) => d.id)));
    }, []),
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Interviews' }} />
      <Screen>
        <T v="subhead" tone="secondary" style={{ marginTop: -8, paddingHorizontal: 4 }}>
          Mock system design interviews you can do on a phone. An interviewer asks, you decide, and every choice gets feedback.
        </T>
        <Group>
          {designs.map((d, i) => {
            const attempts = history[d.id] ?? [];
            const last = attempts.at(-1);
            const status = drafts.has(d.id)
              ? 'In progress'
              : last
                ? `Last score ${Math.round(attemptScore(last) * 100)}% · ${attempts.length} session${attempts.length > 1 ? 's' : ''}`
                : getInterview(d.id)
                  ? 'Not attempted yet'
                  : 'Whiteboard only (web app)';
            const dot = d.difficulty === 'Hard' ? c.fail : d.difficulty === 'Medium' ? c.warn : c.pass;
            return (
              <Row
                key={d.id}
                last={i === designs.length - 1}
                onPress={() => router.push(`/interviews/design/${d.id}`)}
                left={<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} accessibilityLabel={d.difficulty} />}
                title={d.title}
                subtitle={<T v="footnote" tone={drafts.has(d.id) ? 'accent' : 'secondary'}>{status}</T>}
              />
            );
          })}
        </Group>
        <Card>
          <T v="footnote" tone="secondary">
            Tip: do the guided interview here, then a few days later do the whiteboard version of the same prompt from memory in the web app.
          </T>
        </Card>
      </Screen>
    </>
  );
}
