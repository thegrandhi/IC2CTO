import { router, Stack, type Href } from 'expo-router';
import { useRef } from 'react';
import { View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Icon } from '../components/Icon';
import { InlineMd, Markdown } from '../components/Markdown';
import { Button, Card, Empty, Pill, Screen, T, type } from '../components/ui';
import { allLessons, allQuestions, getLesson, getQuizCategory } from '../lib/content';
import { markLessonRead, useAppSelector } from '../lib/store';
import { useColors } from '../lib/theme';

/**
 * A lesson reader. `base` is the stack it lives in (a tab, or the modal reader opened
 * from a quiz), so "Next lesson" pushes within the same stack.
 */
export function LessonScreen({ id, base }: { id: string; base?: string }) {
  const c = useColors();
  const lesson = getLesson(id);
  const read = useAppSelector((s) => !!s.lessonsRead[id]);
  const marked = useRef(false);

  if (!lesson) return <Empty icon="book" title="Lesson not found" body="It may have been renamed in an update." />;

  const cat = getQuizCategory(lesson.category);
  const lessons = allLessons();
  const next = lessons[lessons.findIndex((l) => l.id === id) + 1];
  const checks = allQuestions().filter((q) => q.lesson === id).length;

  // Reaching the end of the lesson marks it read, like the web app.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (!marked.current && layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
      marked.current = true;
      if (!read) markLessonRead(id);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: lesson.title, headerLargeTitle: false }} />
      <Screen onScroll={onScroll} scrollEventThrottle={200}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {cat && <Pill color={c.cat[cat.color]}>{cat.title}</Pill>}
          <T v="footnote" tone="secondary">
            {lesson.minutes} min read
          </T>
          {read && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <Icon name="check" size={12} color={c.pass} />
              <T v="footnote" tone="pass">
                Read
              </T>
            </View>
          )}
        </View>
        <T v="title1" selectable>
          {lesson.title}
        </T>
        <T v="callout" tone="secondary" style={{ marginTop: -8 }}>
          {lesson.summary}
        </T>
        <Markdown text={lesson.body} />
        {lesson.takeaways.length > 0 && (
          <Card style={{ gap: 10, backgroundColor: c.accentSoft }}>
            <T v="headline">Key takeaways</T>
            {lesson.takeaways.map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ marginTop: 4 }}>
                  <Icon name="check" size={13} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <InlineMd text={t} base={type.callout} />
                </View>
              </View>
            ))}
          </Card>
        )}
        {lesson.links.length > 0 && (
          <View style={{ gap: 6 }}>
            <T v="footnote" tone="secondary">
              Go deeper (needs a connection)
            </T>
            {lesson.links.map((l, i) => (
              <InlineMd key={i} text={`• ${l}`} base={type.subhead} />
            ))}
          </View>
        )}
        <View style={{ gap: 10, marginTop: 8 }}>
          {checks > 0 && (
            <Button
              title={`Check yourself (${checks})`}
              icon="bolt"
              onPress={() => {
                markLessonRead(id);
                router.push({ pathname: '/session', params: { kind: 'lesson', lesson: id } });
              }}
            />
          )}
          {next && base !== undefined && (
            <Button kind="secondary" title={`Next: ${next.title}`} onPress={() => router.push(`${base}/lesson/${next.id}` as Href)} />
          )}
        </View>
      </Screen>
    </>
  );
}
