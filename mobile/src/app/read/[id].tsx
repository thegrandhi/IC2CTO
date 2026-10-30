import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';
import { T } from '../../components/ui';
import { LessonScreen } from '../../screens/LessonScreen';

/** A lesson opened from a quiz explanation, as a sheet over the quiz. */
export default function ReadLesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <T tone="accent" style={{ fontWeight: '600' }}>
                Done
              </T>
            </Pressable>
          ),
        }}
      />
      <LessonScreen id={id} />
    </>
  );
}
