import NativeSegmentedControl, { type SegmentedControlProps } from '@react-native-segmented-control/segmented-control';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { router, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import type { ComponentType } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { Group, Row, Screen, T } from '../components/ui';
import { haptic } from '../lib/haptics';
import { exportBackup, importBackup, resetAll, updateSettings, useAppState, type ThemeSetting } from '../lib/store';
import { useColors } from '../lib/theme';

// The library's class typings predate React 19's JSX types.
const SegmentedControl = NativeSegmentedControl as unknown as ComponentType<SegmentedControlProps>;

const THEMES: ThemeSetting[] = ['system', 'light', 'dark'];

export default function Settings() {
  const s = useAppState();
  const c = useColors();

  const exportFile = async () => {
    const file = new File(Paths.cache, `base-case-backup-${new Date().toISOString().slice(0, 10)}.json`);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(exportBackup(), null, 2));
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your Base Case backup' });
  };

  const restore = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'public.json'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    try {
      const data = JSON.parse(await new File(res.assets[0].uri).text());
      Alert.alert('Replace progress on this phone?', 'Everything here will be replaced by the backup.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            try {
              importBackup(data);
              haptic.success();
              Alert.alert('Backup restored');
            } catch (e) {
              Alert.alert('Couldn’t restore', (e as Error).message);
            }
          },
        },
      ]);
    } catch {
      Alert.alert('Couldn’t read that file', 'Pick a .json backup exported from Base Case.');
    }
  };

  const reset = () =>
    Alert.alert('Erase all progress?', 'Streaks, answers, lessons and interview history on this phone will be deleted. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: () => {
          resetAll();
          haptic.warn();
        },
      },
    ]);

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
      <Screen>
        <Label>Appearance</Label>
        <SegmentedControl
          values={['System', 'Light', 'Dark']}
          selectedIndex={THEMES.indexOf(s.settings.theme)}
          onChange={(e) => updateSettings({ theme: THEMES[e.nativeEvent.selectedSegmentIndex] })}
        />
        <Group>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52 }}>
            <T style={{ flex: 1 }}>Haptics</T>
            <Switch value={s.settings.haptics !== false} onValueChange={(v) => updateSettings({ haptics: v })} trackColor={{ true: c.accent }} />
          </View>
        </Group>

        <Label>Backup</Label>
        <Group>
          <Row title="Export backup" subtitle="Save a .json file to Files, AirDrop it, or open it in the web app." onPress={exportFile} />
          <Row last title="Restore from file" subtitle="Works with backups from the web app too." onPress={restore} />
        </Group>

        <Group>
          <Pressable onPress={reset} style={({ pressed }) => ({ paddingHorizontal: 16, minHeight: 52, justifyContent: 'center', backgroundColor: pressed ? c.fill : 'transparent' })}>
            <T tone="fail">Erase all progress</T>
          </Pressable>
        </Group>

        <T v="footnote" tone="secondary" style={{ paddingHorizontal: 4 }}>
          Everything stays on this phone. Nothing is sent anywhere, and the app works without a connection.
        </T>
      </Screen>
    </>
  );
}

function Label({ children }: { children: string }) {
  return (
    <T v="footnote" tone="secondary" style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: -8, marginTop: 4, paddingHorizontal: 4 }}>
      {children}
    </T>
  );
}
