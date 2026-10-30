import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import { Icon } from '../components/Icon';
import { QuizCard } from '../components/QuizCard';
import { Button, Card, Empty, T } from '../components/ui';
import { allQuestions, getLesson, getQuizCategory } from '../lib/content';
import { dueQuestions, pickDailyQuestion, practiceSet, quickReps } from '../lib/planner';
import { todayStr, type QuizQuestion } from '../lib/shared';
import { getState, pinDailyQuestion, recordAnswer } from '../lib/store';
import { space, useColors } from '../lib/theme';

type Params = { kind?: string; category?: string; lesson?: string; size?: string };

function buildSet(p: Params, round: number): { title: string; questions: QuizQuestion[]; daily?: boolean } {
  const s = getState();
  const today = todayStr();
  switch (p.kind) {
    case 'daily': {
      const q = pickDailyQuestion(s, today);
      return { title: 'Daily question', questions: q ? [q] : [], daily: true };
    }
    case 'review':
      return { title: 'Missed questions', questions: dueQuestions(s, today).slice(0, 15) };
    case 'reps':
      return { title: 'Quick reps', questions: quickReps(s, today, 6, String(round)) };
    case 'lesson': {
      const lesson = getLesson(p.lesson ?? '');
      return { title: lesson ? `Check: ${lesson.title}` : 'Lesson check', questions: allQuestions().filter((q) => q.lesson === lesson?.id) };
    }
    default: {
      const cat = p.category ? getQuizCategory(p.category) : undefined;
      return { title: cat ? cat.title : 'Mixed practice', questions: practiceSet(s, today, p.category ?? null, Number(p.size ?? 5), String(round)) };
    }
  }
}

export default function Session() {
  const params = useLocalSearchParams<Params>();
  const c = useColors();
  const scroll = useRef<ScrollViewInstance>(null);
  const [round, setRound] = useState(0);
  // Built once per round so answering doesn't reshuffle the set.
  const [set, setSet] = useState(() => buildSet(params, 0));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [alreadyAnswered] = useState(() => !!set.daily && getState().daily[todayStr()]?.correct !== undefined);

  useEffect(() => {
    if (set.daily && set.questions[0]) pinDailyQuestion(set.questions[0].id);
  }, [set]);

  const go = (i: number) => {
    setIndex(i);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const again = () => {
    const r = round + 1;
    setRound(r);
    setSet(buildSet(params, r));
    setAnswers([]);
    go(0);
  };

  const close = (
    <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
      <T tone="accent" style={{ fontWeight: '600' }}>
        Close
      </T>
    </Pressable>
  );

  const total = set.questions.length;
  const finished = index >= total;
  const q = set.questions[Math.min(index, total - 1)];

  return (
    <>
      <Stack.Screen options={{ title: set.title, headerLeft: () => close }} />
      <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space, paddingBottom: 48, gap: 16 }} contentInsetAdjustmentBehavior="automatic">
        {!total ? (
          <Empty
            icon="tray"
            title="Nothing here right now"
            body={params.kind === 'review' ? 'No missed questions are due. Nice work.' : 'No questions found for this set.'}
            action={<Button kind="secondary" title="Close" onPress={() => router.back()} style={{ marginTop: 8, alignSelf: 'stretch' }} />}
          />
        ) : finished ? (
          <Results title={set.title} questions={set.questions} answers={answers} onAgain={params.kind === 'reps' || params.kind === 'practice' || !params.kind ? again : undefined} />
        ) : (
          <>
            {total > 1 && (
              <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Question ${index + 1} of ${total}`}>
                {set.questions.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: answers[i] === true ? c.pass : answers[i] === false ? c.fail : i === index ? c.accent : c.fill,
                    }}
                  />
                ))}
              </View>
            )}
            <QuizCard
              key={`${round}:${q.id}`}
              q={q}
              reveal={alreadyAnswered}
              onOpenLesson={(id) => router.push(`/read/${id}`)}
              onAnswer={(correct) => {
                setAnswers((a) => {
                  const next = [...a];
                  next[index] = correct;
                  return next;
                });
                recordAnswer(q.id, correct, { daily: set.daily });
              }}
              footer={
                set.daily ? (
                  <Button title="Done" onPress={() => router.back()} />
                ) : (
                  <Button title={index + 1 < total ? 'Next question' : 'See results'} icon="arrow" onPress={() => go(index + 1)} />
                )
              }
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

function Results({ title, questions, answers, onAgain }: { title: string; questions: QuizQuestion[]; answers: boolean[]; onAgain?: () => void }) {
  const c = useColors();
  const right = answers.filter(Boolean).length;
  const missed = questions.filter((_, i) => answers[i] === false);
  return (
    <Card style={{ gap: 14, padding: 20 }}>
      <T v="footnote" tone="secondary">
        {title}
      </T>
      <T v="largeTitle" style={{ fontVariant: ['tabular-nums'] }}>
        {right}/{questions.length} correct
      </T>
      <T v="callout" tone="secondary">
        {right === questions.length
          ? 'Clean sweep. These move further out in your review schedule.'
          : `${missed.length} missed question${missed.length > 1 ? 's' : ''} will come back tomorrow.`}
      </T>
      {missed.map((m) => {
        const lesson = m.lesson ? getLesson(m.lesson) : undefined;
        return (
          <View key={m.id} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ marginTop: 3 }}>
              <Icon name="x" size={12} color={c.fail} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="subhead" numberOfLines={2}>
                {m.prompt.split('\n')[0].replace(/[*`]/g, '')}
              </T>
              {lesson && (
                <Pressable onPress={() => router.push(`/read/${lesson.id}`)} hitSlop={6}>
                  <T v="footnote" tone="accent">
                    Read: {lesson.title}
                  </T>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
      <View style={{ gap: 10, marginTop: 4 }}>
        {onAgain && <Button title="Another round" icon="reset" onPress={onAgain} />}
        <Button kind="secondary" title="Done" onPress={() => router.back()} />
      </View>
    </Card>
  );
}
