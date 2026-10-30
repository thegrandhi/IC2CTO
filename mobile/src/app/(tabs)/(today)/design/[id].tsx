import { useLocalSearchParams } from 'expo-router';
import { DesignScreen } from '../../../../screens/DesignScreen';

export default function Design() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DesignScreen id={id} />;
}
