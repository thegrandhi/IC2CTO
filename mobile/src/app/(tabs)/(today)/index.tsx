import { router, Stack } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '../../../components/Icon';
import { Card, Group, PressableScale, ProgressBar, Row, Screen, SectionTitle, T } from '../../../components/ui';
import { getQuizCategory } from '../../../lib/content';
import { categoryStats, daysSinceLastDesign, dueQuestions, nextLesson, pickDailyQuestion, suggestedDesign } from '../../../lib/planner';
import { addDays, todayStr } from '../../../lib/shared';
import { activityTotal, dayActivity, pinDailyQuestion, streak, useAppState } from '../../../lib/store';
import { radius, useColors } from '../../../lib/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late-night session';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface Item {
  key: string;
  icon: IconName;
  kicker: string;
  title: string;
  detail: string;
  done: boolean;
  onPress: () => void;
}

export default function Today() {
  const s = useAppState();
  const c = useColors();
  const today = todayStr();
  const daily = pickDailyQuestion(s, today);

  useEffect(() => {
    if (daily) pinDailyQuestion(daily.id);
  }, [daily]);

  const act = dayActivity(s, today);
  const dueQ = dueQuestions(s, today);
  const lesson = nextLesson(s);
  const design = suggestedDesign(s);
  const sinceDesign = daysSinceLastDesign(s, today);
  const dailyLog = s.daily[today];
  const cat = daily ? getQuizCategory(daily.category) : undefined;

  const items: Item[] = [];
  if (daily) {
    const answered = dailyLog?.correct !== undefined;
    items.push({
      key: 'daily',
      icon: 'calendar',
      kicker: `Daily question${cat ? ` · ${cat.title}` : ''}`,
      title: 'System design rep',
      detail: !answered ? 'One question, then the reasoning behind the answer.' : dailyLog.correct ? 'Nailed it.' : 'Missed. It will come back for review.',
      done: answered,
      onPress: () => router.push({ pathname: '/session', params: { kind: 'daily' } }),
    });
  }
  if (dueQ.length) {
    items.push({
      key: 'review',
      icon: 'retry',
      kicker: 'Missed questions',
      title: `${dueQ.length} question${dueQ.length > 1 ? 's' : ''} to retry`,
      detail: 'Questions you got wrong come back until they stick.',
      done: false,
      onPress: () => router.push({ pathname: '/session', params: { kind: 'review' } }),
    });
  }
  if (lesson) {
    items.push({
      key: 'lesson',
      icon: 'book',
      kicker: `Learn · ${lesson.minutes} min read`,
      title: lesson.title,
      detail: lesson.summary,
      done: act.lessons > 0,
      onPress: () => router.push(`/lesson/${lesson.id}`),
    });
  }
  if (design) {
    const due = sinceDesign === null || sinceDesign >= 7;
    items.push({
      key: 'design',
      icon: 'chat',
      kicker: due ? 'Weekly mock interview · 15 min' : `Mock interview · last one ${sinceDesign}d ago`,
      title: design.title,
      detail: 'Ask clarifying questions, estimate, pick tradeoffs and build the request paths.',
      done: act.designs > 0 || !due,
      onPress: () => router.push(`/design/${design.id}`),
    });
  }

  const doneCount = items.filter((i) => i.done).length + (act.quiz >= 6 ? 1 : 0);
  const total = items.length + 1;
  const st = streak(s, today);
  const cats = categoryStats(s);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Today',
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Settings">
              <Icon name="gear" size={20} color={c.accent} />
            </Pressable>
          ),
        }}
      />
      <Screen>
        <T v="subhead" tone="secondary" style={{ marginTop: -8, paddingHorizontal: 4 }}>
          {greeting()}. {doneCount >= total ? 'Workout complete. See you tomorrow.' : `${doneCount} of ${total} done in today’s workout.`}
        </T>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat label="Streak" value={st} unit={st === 1 ? 'day' : 'days'} />
          <Stat label="Answered" value={Object.keys(s.questions).length} />
          <Stat label="Due" value={dueQ.length} />
        </View>

        <PressableScale
          onPress={() => router.push({ pathname: '/session', params: { kind: 'reps' } })}
          style={{ backgroundColor: c.accent, borderRadius: radius.card, borderCurve: 'continuous', padding: 18, gap: 6 }}
          accessibilityLabel="Start quick reps"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="flame" size={18} color={c.onAccent} />
            <T v="footnote" tone="onAccent" style={{ fontWeight: '600', opacity: 0.8 }}>
              QUICK REPS · 3 MIN · TAP-ONLY
            </T>
            {act.quiz >= 6 && (
              <View style={{ marginLeft: 'auto' }}>
                <Icon name="done" size={18} color={c.onAccent} />
              </View>
            )}
          </View>
          <T v="title2" tone="onAccent">
            {act.quiz >= 6 ? 'Another round' : 'Code drills + system design'}
          </T>
          <T v="subhead" tone="onAccent" style={{ opacity: 0.85 }}>
            Fill-in-the-blank code, order the lines, and design questions. Six of them, alternating.
          </T>
        </PressableScale>

        <SectionTitle>Today’s workout</SectionTitle>
        <Group>
          {items.map((item, i) => (
            <Row
              key={item.key}
              last={i === items.length - 1}
              onPress={item.onPress}
              left={<Icon name={item.done ? 'done' : item.icon} size={20} color={item.done ? c.pass : c.accent} />}
              title={
                <View style={{ gap: 1 }}>
                  <T v="caption" tone="secondary" style={{ fontWeight: '600' }}>
                    {item.kicker}
                  </T>
                  <T v="headline" style={item.done ? { color: c.secondary } : undefined}>
                    {item.title}
                  </T>
                </View>
              }
              subtitle={item.detail}
            />
          ))}
        </Group>

        <SectionTitle>Activity</SectionTitle>
        <Card style={{ gap: 10 }}>
          <Heatmap />
          <T v="footnote" tone="secondary">
            {Object.values(s.activity).filter((a) => activityTotal(a) > 0).length} active days so far. A day counts when you answer, read or interview.
          </T>
        </Card>

        <SectionTitle>System design mastery</SectionTitle>
        <Card style={{ gap: 14 }}>
          {cats.map((cs) => (
            <Pressable key={cs.id} onPress={() => router.push({ pathname: '/session', params: { kind: 'practice', category: cs.id } })} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T v="subhead">{cs.title}</T>
                <T v="subhead" tone="secondary" style={{ fontVariant: ['tabular-nums'] }}>
                  {cs.mastered}/{cs.total}
                </T>
              </View>
              <ProgressBar value={cs.mastered} max={cs.total} />
            </Pressable>
          ))}
        </Card>

        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="laptop" size={20} color={c.secondary} />
          <View style={{ flex: 1, gap: 4 }}>
            <T v="headline">Coding problems live on the web app</T>
            <T v="footnote" tone="secondary">
              The 138 problems need an editor and a Python runtime, so they stay on the laptop version. Move your progress between the two with Settings → Backup.
            </T>
          </View>
        </Card>
      </Screen>
    </>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: 12, gap: 2 }}>
      <T v="caption" tone="secondary" style={{ fontWeight: '600' }}>
        {label.toUpperCase()}
      </T>
      <T v="title2" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
        {unit && (
          <T v="footnote" tone="secondary">
            {' '}
            {unit}
          </T>
        )}
      </T>
    </Card>
  );
}

/** 18 weeks of activity: columns are weeks, rows Sunday to Saturday. */
function Heatmap() {
  const s = useAppState();
  const c = useColors();
  const today = todayStr();
  const weeks = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - end.getDay() - 7 * 17);
    const cols: string[][] = [];
    for (let d = todayStr(start); d <= today; d = addDays(d, 1)) {
      if (!cols.length || cols[cols.length - 1].length === 7) cols.push([]);
      cols[cols.length - 1].push(d);
    }
    return cols;
  }, [today]);
  const level = (d: string) => {
    const t = activityTotal(s.activity[d]);
    return t === 0 ? 0 : t < 3 ? 0.35 : t < 6 ? 0.65 : 1;
  };
  return (
    <View style={{ flexDirection: 'row', gap: 3, justifyContent: 'space-between' }} accessibilityLabel="Activity over the last 18 weeks">
      {weeks.map((w, i) => (
        <View key={i} style={{ gap: 3, flex: 1 }}>
          {w.map((d) => (
            <View key={d} style={{ aspectRatio: 1, borderRadius: 3, backgroundColor: level(d) ? c.accent : c.fill, opacity: level(d) || 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}
