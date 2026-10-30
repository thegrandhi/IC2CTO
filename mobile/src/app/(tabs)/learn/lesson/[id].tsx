import { useLocalSearchParams } from 'expo-router';
import { LessonScreen } from '../../../../screens/LessonScreen';

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonScreen id={id} base="/learn" />;
}
