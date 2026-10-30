# Base Case for iOS

A native iPhone app (Expo / React Native) for the phone-first half of Base Case: **Quick Reps**, the **daily question**, **missed-question reviews**, the **27 lessons**, and the **12 guided mock design interviews**. It works fully offline, and progress stays on the phone.

It reads the same Markdown in `/content` and reuses the web app's parsers, scoring and spaced repetition from `/src/lib`, so new questions, lessons and interviews show up in both apps. The 138 coding problems stay in the web app, because they need an editor and a Python runtime.

Backups use the same format in both apps: **Settings → Export backup** on the phone produces a file the web app can restore, and the reverse works too.

## What's native

- Native tab bar (Liquid Glass on iOS 26) with SF Symbols, large-title navigation, and sheets for quiz sets, settings and lessons opened from a quiz
- iOS system colors in light and dark mode, plus an in-app theme override. Lime is the only accent.
- Haptics on selection and answers (can be turned off in Settings)
- The native segmented control and switch; system share sheet and Files picker for backups
- Storage in on-device SQLite (`expo-sqlite/kv-store`)

The UI follows the Appllama app design skill in `/.claude/skills/appllama-app-design-skill`.

## Run it

```bash
cd mobile
npm install          # also bundles /content into src/content.generated.ts
npm run check        # typecheck + lint + iOS bundle
```

On a Mac with Xcode:

```bash
npx expo run:ios     # builds and opens in the iOS Simulator
```

Without a Mac, build in the cloud with EAS (below) and install it on your iPhone.

Run `npm run content` after editing anything in `/content` while the dev server is running.

## Ship it to the App Store

You need an Apple Developer Program membership ($99/year) and a free Expo account. EAS builds and signs the app in the cloud, so you don't need a Mac.

1. **Pick your bundle ID.** `app.json` uses `com.thegrandhi.basecase`. Change `ios.bundleIdentifier` (and `android.package`) to a reverse-DNS name you own before the first build. It can't change after you publish.
2. **Link the project to Expo:**
   ```bash
   cd mobile
   npx eas-cli@latest login
   npx eas-cli@latest init        # writes your projectId into app.json
   ```
3. **First build (interactive).** EAS asks for your Apple ID and creates the certificate, provisioning profile and App Store Connect app record for you:
   ```bash
   npx eas-cli@latest build --platform ios --profile production
   ```
4. **Send it to TestFlight:**
   ```bash
   npx eas-cli@latest submit --platform ios --latest
   ```
   Install TestFlight on your iPhone to try the build. Add testers in App Store Connect.
5. **Release.** In App Store Connect, fill in the listing (description, keywords, privacy policy URL), add 6.9" iPhone screenshots, and answer the privacy questionnaire. The app collects no data, and `usesNonExemptEncryption` is already set to `false`. Then submit for review.

To try a build on your own phone before TestFlight, use `--profile preview`. It's an ad-hoc build, so EAS registers your device first.

After the first build, the **iOS app** GitHub Actions workflow can build and submit for you: add an `EXPO_TOKEN` repository secret (expo.dev → Account settings → Access tokens), then run the workflow manually with **Build and submit to TestFlight** ticked.

## Layout

```
mobile/
  src/app/                 Expo Router screens
    (tabs)/(today)         Today: daily workout, streak, activity
    (tabs)/practice        Quick reps, mixed sets, subjects, missed questions
    (tabs)/learn           Lessons
    (tabs)/interviews      Mock design interviews and reference answers
    session.tsx            A quiz set (sheet)
    interview/[id].tsx     Guided interview chat (full screen)
    settings.tsx           Theme, haptics, backup, reset
  src/components/          Quiz card, native Markdown renderer, UI kit
  src/lib/shared.ts        Re-exports the web app's parsers, scoring and SRS
  src/lib/store.ts         Progress, in the web app's backup format
  scripts/bundle-content.mjs
```
