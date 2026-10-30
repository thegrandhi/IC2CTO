import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { Card, Group, ProgressBar, Row, Screen, SectionTitle, T } from '../../../components/ui';
import { categoryStats, dueQuestions } from '../../../lib/planner';
import { CODING_CATEGORIES, todayStr } from '../../../lib/shared';
import { useAppState } from '../../../lib/store';
import { useColors } from '../../../lib/theme';

export default function Practice() {
  const s = useAppState();
  const c = useColors();
  const due = dueQuestions(s, todayStr()).length;
  const stats = categoryStats(s);
  const design = stats.filter((x) => !CODING_CATEGORIES.includes(x.id));
  const coding = stats.filter((x) => CODING_CATEGORIES.includes(x.id));
  const open = (params: Record<string, string>) => router.push({ pathname: '/session', params });

  const section = (title: string, list: typeof stats) => (
    <>
      <SectionTitle>{title}</SectionTitle>
      <Group>
        {list.map((x, i) => (
          <Row
            key={x.id}
            last={i === list.length - 1}
            onPress={() => open({ kind: 'practice', category: x.id })}
            left={<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.cat[x.color] }} />}
            title={x.title}
            subtitle={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <ProgressBar value={x.mastered} max={x.total} />
                <T v="caption" tone="secondary" style={{ fontVariant: ['tabular-nums'], minWidth: 48, textAlign: 'right' }}>
                  {x.mastered}/{x.total}
                </T>
              </View>
            }
          />
        ))}
      </Group>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Practice' }} />
      <Screen>
        <Group>
          <Row
            onPress={() => open({ kind: 'reps' })}
            left={<Icon name="flame" size={20} color={c.accent} />}
            title={<T v="headline">Quick reps</T>}
            subtitle="Six tap-only drills, code and design alternating."
          />
          <Row
            onPress={() => open({ kind: 'practice', size: '10' })}
            left={<Icon name="bolt" size={20} color={c.accent} />}
            title={<T v="headline">Mixed set</T>}
            subtitle="Ten questions from every subject."
          />
          <Row
            last
            onPress={() => open({ kind: 'review' })}
            left={<Icon name="retry" size={20} color={c.accent} />}
            title={<T v="headline">Missed questions</T>}
            subtitle={due ? `${due} due for another try.` : 'Nothing due. Wrong answers come back here.'}
            detail={due ? String(due) : undefined}
          />
        </Group>
        {section('System design', design)}
        {section('Coding drills', coding)}
        <Card>
          <T v="footnote" tone="secondary">
            Each subject set picks five questions: ones due for review first, then new ones, then ones you missed. Right answers move further out on a spaced-repetition schedule.
          </T>
        </Card>
      </Screen>
    </>
  );
}
