import { router, Stack } from 'expo-router';
import { Icon } from '../../../components/Icon';
import { Group, Row, Screen, T } from '../../../components/ui';
import { allLessons, lessonSections } from '../../../lib/content';
import { useAppSelector } from '../../../lib/store';
import { useColors } from '../../../lib/theme';

export default function Learn() {
  const c = useColors();
  const read = useAppSelector((s) => s.lessonsRead);
  const total = allLessons().length;
  const done = allLessons().filter((l) => read[l.id]).length;

  return (
    <>
      <Stack.Screen options={{ title: 'Learn' }} />
      <Screen>
        <T v="subhead" tone="secondary" style={{ marginTop: -8, paddingHorizontal: 4 }}>
          {done} of {total} lessons read. Each one takes a few minutes and ends with a quick check.
        </T>
        {lessonSections().map((sec) => (
          <Group key={sec.id} style={{ marginTop: 4 }}>
            <SectionHeader title={sec.title} />
            {sec.lessons.map((l, i) => (
              <Row
                key={l.id}
                last={i === sec.lessons.length - 1}
                onPress={() => router.push(`/learn/lesson/${l.id}`)}
                left={<Icon name={read[l.id] ? 'done' : 'circle'} size={20} color={read[l.id] ? c.pass : c.tertiary} weight="regular" />}
                title={l.title}
                subtitle={l.summary}
                detail={`${l.minutes}m`}
              />
            ))}
          </Group>
        ))}
      </Screen>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <T v="footnote" tone="secondary" style={{ fontWeight: '600', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {title}
    </T>
  );
}

